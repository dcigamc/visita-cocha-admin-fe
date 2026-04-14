import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {BetaAnalyticsDataClient} from "@google-analytics/data";

admin.initializeApp();

const db = admin.firestore();
const analyticsClient = new BetaAnalyticsDataClient();

/**
 * Obtiene un resumen de métricas desde Google Analytics 4 (Últimos 7 días).
 */
export const getAnalyticsSummary = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuario no autenticado.");
  }

  // Se recomienda configurar vía: firebase functions:secrets:set GA4_PROPERTY_ID=tu_id
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!propertyId) {
    logger.warn("GA4_PROPERTY_ID no configurado");
    return { activeUsers: 0, sessions: 0, screenPageViews: 0 };
  }

  try {
    const [response] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
    });

    const values = response.rows?.[0]?.metricValues || [];
    return {
      activeUsers: parseInt(values[0]?.value || "0"),
      sessions: parseInt(values[1]?.value || "0"),
      screenPageViews: parseInt(values[2]?.value || "0"),
    };
  } catch (error: unknown) {
    logger.error("Error al obtener analytics", error);
    throw new HttpsError("internal", "Error al recuperar datos de Analytics.");
  }
});

/**
 * Crea un nuevo usuario en Firebase Auth y su perfil en Firestore.
 */
export const createUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuario no autenticado.");
  }

  const callerUid = request.auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!callerData || (callerData.role !== "superadmin" &&
      callerData.role !== "admin")) {
    throw new HttpsError("permission-denied", "Sin permisos.");
  }

  const {email, password, displayName, role, permissions} = request.data;

  if (!email || !password || !displayName || !role) {
    throw new HttpsError("invalid-argument", "Faltan campos.");
  }

  if (callerData.role === "admin" && role !== "maintainer") {
    throw new HttpsError("permission-denied", "Solo puede crear maintainers.");
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    const newUser = {
      uid: userRecord.uid,
      email,
      displayName,
      role,
      isActive: true,
      permissions,
      createdBy: callerUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    const userDocRef = db.collection("users").doc(userRecord.uid);
    batch.set(userDocRef, newUser);

    const logDocRef = db.collection("logs").doc();
    batch.set(logDocRef, {
      action: "CREATE_USER",
      module: "users",
      userId: callerUid,
      userEmail: callerData.email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: `Usuario creado: ${email} con rol ${role}`,
      newData: newUser,
    });

    await batch.commit();
    logger.info(`Usuario creado: ${email}`, {uid: userRecord.uid});
    return {success: true, uid: userRecord.uid};
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    logger.error("Error al crear usuario", error);
    throw new HttpsError("internal", msg);
  }
});

/**
 * Habilita o deshabilita un usuario en Firebase Auth y Firestore.
 */
export const toggleUserStatusAuth = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuario no autenticado.");
  }

  const callerUid = request.auth.uid;
  const {uid, isActive, displayName} = request.data;

  if (!uid || isActive === undefined) {
    throw new HttpsError("invalid-argument", "Faltan parámetros.");
  }

  try {
    // 1. Actualizar en Firebase Auth (disabled es lo opuesto a isActive)
    await admin.auth().updateUser(uid, {
      disabled: !isActive,
    });

    // 2. Actualizar en Firestore
    await db.collection("users").doc(uid).update({
      isActive,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Registrar Log
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerData = callerDoc.data();

    await db.collection("logs").add({
      action: isActive ? "ENABLE_USER" : "DISABLE_USER",
      module: "users",
      userId: callerUid,
      userEmail: callerData?.email || "unknown",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: `Usuario ${isActive ? "habilitado" : "deshabilitado"}: ${displayName} (UID: ${uid})`,
    });

    return {success: true};
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido";
    logger.error("Error al cambiar estado de usuario", error);
    throw new HttpsError("internal", msg);
  }
});
