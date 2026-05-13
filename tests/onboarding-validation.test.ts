import { describe, expect, it } from 'vitest';

import { validateJefeOnboardingInput, validateWorkerOnboardingInput } from '@/lib/onboarding';

describe('onboarding field validation', () => {
  it('accepts valid worker onboarding input and normalizes form values', () => {
    const result = validateWorkerOnboardingInput({
      firstName: '  Ana  ',
      lastName: '  Gomez ',
      dniNumber: ' 30123456 ',
      addressText: '  Salta Capital ',
      workerCategories: ['cleaning', 'painting'],
      hourlyRatePesos: '4500'
    });

    expect(result).toEqual({
      ok: true,
      data: {
        firstName: 'Ana',
        lastName: 'Gomez',
        dniNumber: '30123456',
        addressText: 'Salta Capital',
        workerCategories: ['cleaning', 'painting'],
        hourlyRatePesos: 4500
      },
      fieldErrors: {}
    });
  });

  it('accepts the showcase trade categories', () => {
    const result = validateWorkerOnboardingInput({
      firstName: 'Hernan',
      lastName: 'Boan',
      dniNumber: '30123456',
      addressText: 'San Martin de los Andes',
      workerCategories: ['carpinteria', 'zingueria', 'electricidad', 'herreria'],
      hourlyRatePesos: '15000'
    });

    expect(result).toEqual({
      ok: true,
      data: {
        firstName: 'Hernan',
        lastName: 'Boan',
        dniNumber: '30123456',
        addressText: 'San Martin de los Andes',
        workerCategories: ['carpinteria', 'zingueria', 'electricidad', 'herreria'],
        hourlyRatePesos: 15000
      },
      fieldErrors: {}
    });
  });

  it('returns worker required-field errors next to the failing fields', () => {
    const result = validateWorkerOnboardingInput({
      firstName: '',
      lastName: '   ',
      dniNumber: '',
      addressText: '  ',
      workerCategories: [],
      hourlyRatePesos: ''
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected worker validation to fail');
    }

    expect(result.fieldErrors).toEqual({
      firstName: ['Ingresá tu nombre.'],
      lastName: ['Ingresá tu apellido.'],
      dniNumber: ['Ingresá un DNI válido de 7 u 8 números.'],
      addressText: ['Ingresá una ubicación válida.'],
      workerCategories: ['Elegí al menos un tipo de trabajo.'],
      hourlyRatePesos: ['Ingresá un precio por hora válido.']
    });
    expect(result.fieldErrors).not.toHaveProperty('_form');
  });

  it('returns worker format errors for dni, category and decimal hourly price', () => {
    const result = validateWorkerOnboardingInput({
      firstName: 'Ana',
      lastName: 'Gomez',
      dniNumber: 'abc123',
      addressText: 'Salta Capital',
      workerCategories: ['unknown-category'],
      hourlyRatePesos: 1250.5
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected worker validation to fail');
    }

    expect(result.fieldErrors).toEqual({
      dniNumber: ['Ingresá un DNI válido de 7 u 8 números.'],
      workerCategories: ['Elegí un tipo de trabajo válido.'],
      hourlyRatePesos: ['El precio por hora debe ser un número entero.']
    });
  });

  it('returns worker range errors for long text and invalid hourly price limits', () => {
    const result = validateWorkerOnboardingInput({
      firstName: 'A'.repeat(41),
      lastName: 'Gomez',
      dniNumber: '30123456',
      addressText: 'S'.repeat(161),
      workerCategories: ['cleaning'],
      hourlyRatePesos: 10_000_001
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected worker validation to fail');
    }

    expect(result.fieldErrors).toEqual({
      firstName: ['Usá 40 caracteres o menos.'],
      addressText: ['Usá 160 caracteres o menos.'],
      hourlyRatePesos: ['El precio por hora es demasiado alto.']
    });
  });

  it('requires worker hourly price to be greater than zero', () => {
    const result = validateWorkerOnboardingInput({
      firstName: 'Ana',
      lastName: 'Gomez',
      dniNumber: '30123456',
      addressText: 'Salta Capital',
      workerCategories: ['cleaning'],
      hourlyRatePesos: 0
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected worker validation to fail');
    }

    expect(result.fieldErrors).toEqual({
      hourlyRatePesos: ['El precio por hora tiene que ser mayor a 0.']
    });
  });

  it('accepts valid jefe onboarding input and normalizes optional private avatar blob path', () => {
    const result = validateJefeOnboardingInput({
      firstName: '  Martin ',
      lastName: ' Ruiz  ',
      addressText: '  Salta Capital ',
      avatarBlobPath: null
    });

    expect(result).toEqual({
      ok: true,
      data: {
        firstName: 'Martin',
        lastName: 'Ruiz',
        addressText: 'Salta Capital',
        avatarBlobPath: null
      },
      fieldErrors: {}
    });
  });

  it('returns jefe required-field errors next to the failing fields', () => {
    const result = validateJefeOnboardingInput({
      firstName: '',
      lastName: '',
      addressText: 'x',
      avatarBlobPath: undefined
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected jefe validation to fail');
    }

    expect(result.fieldErrors).toEqual({
      firstName: ['Ingresá tu nombre.'],
      lastName: ['Ingresá tu apellido.'],
      addressText: ['Ingresá una ubicación válida.']
    });
    expect(result.fieldErrors).not.toHaveProperty('_form');
  });

  it('returns jefe avatar blob path errors on avatarBlobPath only', () => {
    const result = validateJefeOnboardingInput({
      firstName: 'Martin',
      lastName: 'Ruiz',
      addressText: 'Salta Capital',
      avatarBlobPath: 'https://example.com/avatar.png'
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected jefe validation to fail');
    }

    expect(result.fieldErrors).toEqual({
      avatarBlobPath: ['Subí una foto válida.']
    });
  });
});
