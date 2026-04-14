import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

const db = admin.firestore();

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
