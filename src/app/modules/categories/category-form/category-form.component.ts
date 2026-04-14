import { Component, inject, signal, input, output, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService, CategoryType } from '../services/category.service';
import { CategoryModel } from '../../../core/models/category.model';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  standalone: false
})
export class CategoryFormComponent {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private messageService = inject(MessageService);

  categoryToEdit = input<CategoryModel | null>(null);
  type = input.required<CategoryType>();
  
  onSave = output<void>();
  onCancel = output<void>();

  isLoading = signal(false);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required]],
    icon: ['pi pi-tag'],
    available: [true]
  });

  constructor() {
    effect(() => {
      const category = this.categoryToEdit();
      if (category) {
        this.form.patchValue(category);
      } else {
        this.form.reset({
          available: true,
          icon: 'pi pi-tag'
        });
      }
    });

    // Auto-slug from name
    this.form.get('name')?.valueChanges.subscribe(name => {
      if (!this.categoryToEdit()) {
        const slug = name.toLowerCase().trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        this.form.patchValue({ slug }, { emitEvent: false });
      }
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    const category = this.categoryToEdit();
    const formData = this.form.getRawValue();

    try {
      if (category) {
        await this.categoryService.updateCategory(this.type(), category.id, formData);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría actualizada' });
      } else {
        await this.categoryService.createCategory(this.type(), formData);
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría creada' });
      }
      this.onSave.emit();
    } catch (error: any) {
      console.error(error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error.message || 'Error al guardar' });
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel() {
    this.onCancel.emit();
  }
}
