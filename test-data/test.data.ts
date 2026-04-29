import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const CREDENTIALS = {
  valid: {
    email:    requireEnv('USER_EMAIL'),
    password: requireEnv('USER_PASSWORD'),
  },
  invalid: {
    email:    'wrong@example.com',
    password: 'wrongpassword',
  },
  wrongPassword: {
    email:    requireEnv('USER_EMAIL'),
    password: 'wrongpassword',
  },
} as const;

export const PRODUCTS = {
  iPhone12:  { name: 'Apple iPhone 12, 128GB, Black',      price: 905.99 },
  huawei:    { name: 'Huawei Mate 20 Lite, 64GB, Black',   price: 236.12 },
  samsung:   { name: 'Samsung Galaxy A32, 128GB, White',   price: 286.99 },
  iPhone13:  { name: 'Apple iPhone 13, 128GB, Blue',       price: 918.99 },
  nokia:     { name: 'Nokia 105, Black',                   price: 19.99  },
} as const;

export const SHIPPING = {
  valid: {
    phone:   '+1-555-123-4567',
    street:  '123 Test Street',
    city:    'New York',
    country: 'United States of America',
  },
} as const;
