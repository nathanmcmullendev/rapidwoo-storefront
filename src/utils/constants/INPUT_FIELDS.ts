export const INPUT_FIELDS = [
  {
    id: 0,
    label: 'First Name',
    name: 'firstName',
    customValidation: { required: true, minlength: 4 },
  },
  {
    id: 1,
    label: 'Last Name',
    name: 'lastName',
    customValidation: { required: true, minlength: 4 },
  },
  {
    id: 2,
    label: 'Address',
    name: 'address1',
    customValidation: { required: true, minlength: 4 },
  },
  {
    id: 3,
    label: 'Postal Code',
    name: 'postcode',
    customValidation: { required: true, minlength: 4, pattern: '[+0-9]{4,6}' },
  },
  {
    id: 4,
    label: 'City',
    name: 'city',
    customValidation: { required: true, minlength: 2 },
  },
  {
    id: 5,
    label: 'Email',
    name: 'email',
    customValidation: { required: true, type: 'email' },
  },
  {
    id: 6,
    label: 'Phone',
    name: 'phone',
    customValidation: { required: true, minlength: 8, pattern: '[+0-9]{8,12}' },
  },
];
