import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { BusinessCardComponent } from '../home/components/business-card/business-card.component';
import { AuthService } from '../../core/services/auth.service';
import { BusinessService } from '../../core/services/business.service';
import { ToastService } from '../../core/services/toast.service';
import {
  BUSINESS_TYPES,
  FOOD_TYPES,
  PRICE_RANGES,
  PRICE_LABELS,
  SERVICES,
} from '../../core/data/catalog-options';
import { Business, BusinessPayload, BusinessPreview } from '../../core/models/business.model';
import { getApiErrorMessage } from '../../core/utils/http-error';

/**
 * Formulario de registro de negocio con previsualización en vivo.
 * Todos los campos de la pestaña "Negocios" (salvo los generados por el backend).
 */
@Component({
  selector: 'app-business-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, BusinessCardComponent],
  templateUrl: './business-form.component.html',
  styleUrl: './business-form.component.scss',
})
export class BusinessFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly auth = inject(AuthService);
  private readonly businessService = inject(BusinessService);
  private readonly toast = inject(ToastService);

  readonly businessTypes = BUSINESS_TYPES;
  readonly foodTypes = FOOD_TYPES;
  readonly priceRanges = PRICE_RANGES;
  readonly priceLabels = PRICE_LABELS;
  readonly services = SERVICES;

  readonly submitting = signal(false);
  readonly uploading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly imageUploadError = signal<string | null>(null);
  readonly success = signal<Business | null>(null);
  readonly selectedServices = signal<string[]>([]);

  readonly form = this.fb.group({
    nombre_negocio: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    localidad: ['', [Validators.required, Validators.maxLength(80)]],
    colonia_direccion: ['', [Validators.required, Validators.maxLength(200)]],
    tipo_negocio: ['', [Validators.required]],
    tipo_comida: ['', [Validators.required]],
    descripcion: [
      '',
      [Validators.required, Validators.minLength(20), Validators.maxLength(700)],
    ],
    rango_precios: ['$$', [Validators.required]],
    horario: ['', [Validators.required, Validators.maxLength(160)]],
    whatsapp_telefono: [
      '',
      [Validators.required, Validators.pattern(/^[0-9+\s()-]{10,20}$/)],
    ],
    url_imagen: ['', [Validators.pattern(/^https?:\/\/.+/i), Validators.maxLength(600)]],
    enlace_maps: ['', [Validators.pattern(/^https?:\/\/.+/i), Validators.maxLength(600)]],
  });

  private readonly rawValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** Objeto adaptado a la card mientras el usuario escribe. */
  readonly preview = computed<BusinessPreview>(() => {
    const value = this.rawValue();

    return {
      id_negocio: 'preview',
      nombre_negocio: value.nombre_negocio ?? '',
      localidad: value.localidad ?? '',
      colonia_direccion: value.colonia_direccion ?? '',
      tipo_negocio: value.tipo_negocio ?? '',
      tipo_comida: value.tipo_comida ?? '',
      descripcion: value.descripcion ?? '',
      rango_precios: value.rango_precios ?? '',
      horario: value.horario ?? '',
      whatsapp_telefono: value.whatsapp_telefono ?? '',
      url_imagen: value.url_imagen ?? '',
      enlace_maps: value.enlace_maps ?? '',
      servicios: this.selectedServices().join(', '),
      estado_publicacion: 'APROBADO',
      fecha_creacion: '',
    };
  });

  readonly imageUrl = computed(() => this.rawValue().url_imagen ?? '');

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.touched || control.dirty));
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.hasError(errorName) && (control.touched || control.dirty));
  }

  setPrice(price: string): void {
    this.form.controls.rango_precios.setValue(price);
    this.form.controls.rango_precios.markAsTouched();
  }

  isServiceSelected(service: string): boolean {
    return this.selectedServices().includes(service);
  }

  toggleService(service: string): void {
    this.selectedServices.update((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service]
    );
  }

  clearImage(): void {
    this.form.controls.url_imagen.setValue('');
    this.imageUploadError.set(null);
  }

  /**
   * Subida opcional a ImgBB (vía backend). Si el servidor no tiene
   * IMGBB_API_KEY, se muestra un aviso y el usuario puede pegar la URL.
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.imageUploadError.set(null);

    if (!file.type.startsWith('image/')) {
      this.imageUploadError.set('Selecciona un archivo de imagen (JPG, PNG, WebP o GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.imageUploadError.set('La imagen no puede superar los 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      this.imageUploadError.set('No pudimos leer el archivo. Intenta con otra imagen.');
    };

    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      if (!dataUrl) return;

      this.uploading.set(true);
      this.businessService.uploadImage(dataUrl).subscribe({
        next: (result) => {
          this.form.controls.url_imagen.setValue(result.url);
          this.form.controls.url_imagen.markAsTouched();
          this.uploading.set(false);
          this.toast.success('Imagen subida correctamente.');
        },
        error: (error: unknown) => {
          this.uploading.set(false);
          this.imageUploadError.set(
            getApiErrorMessage(
              error,
              'No pudimos subir la imagen. Pega la URL pública de tu foto.'
            )
          );
        },
      });
    };

    reader.readAsDataURL(file);
  }

  submit(): void {
    if (this.submitting()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Revisa los campos marcados en rojo antes de continuar.');
      this.focusFirstInvalidField();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();
    const payload: BusinessPayload = {
      nombre_negocio: value.nombre_negocio.trim(),
      localidad: value.localidad.trim(),
      colonia_direccion: value.colonia_direccion.trim(),
      tipo_negocio: value.tipo_negocio,
      tipo_comida: value.tipo_comida,
      descripcion: value.descripcion.trim(),
      rango_precios: value.rango_precios,
      horario: value.horario.trim(),
      whatsapp_telefono: value.whatsapp_telefono.trim(),
      url_imagen: value.url_imagen.trim(),
      enlace_maps: value.enlace_maps.trim(),
      servicios: this.selectedServices().join(', '),
    };

    this.businessService.create(payload).subscribe({
      next: (business) => {
        this.submitting.set(false);
        this.success.set(business);
        this.resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.toast.success('¡Tu negocio se registró correctamente!');
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(getApiErrorMessage(error, 'No pudimos registrar tu negocio.'));
      },
    });
  }

  startAnother(): void {
    this.success.set(null);
    this.errorMessage.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private resetForm(): void {
    this.form.reset({
      nombre_negocio: '',
      localidad: '',
      colonia_direccion: '',
      tipo_negocio: '',
      tipo_comida: '',
      descripcion: '',
      rango_precios: '$$',
      horario: '',
      whatsapp_telefono: '',
      url_imagen: '',
      enlace_maps: '',
    });
    this.selectedServices.set([]);
    this.imageUploadError.set(null);
  }

  private focusFirstInvalidField(): void {
    const firstInvalid = document.querySelector<HTMLElement>('.form-panel .is-invalid');
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus({ preventScroll: true });
    }
  }
}
