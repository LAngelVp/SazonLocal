export interface User {
  id_usuario: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  fecha_registro: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre_completo: string;
  email: string;
  password: string;
  telefono: string;
}

export interface ApiErrorResponse {
  error?: {
    message?: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}
