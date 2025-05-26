import { registerDecorator, ValidationOptions } from 'class-validator';

// TODO: consider moving this to a shared validation library if used elsewhere
export function IsAdult(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isAdult',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!(value instanceof Date)) {
            return false;
          }

          const today = new Date();
          let age = today.getFullYear() - value.getFullYear();
          const m = today.getMonth() - value.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < value.getDate())) {
            age--;
          }
          return age >= 18;
        },
        defaultMessage() {
          return 'User must be at least 18 years old';
        },
      },
    });
  };
}
