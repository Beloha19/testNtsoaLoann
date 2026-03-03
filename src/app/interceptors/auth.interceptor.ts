import {AuthService} from '../services/auth/auth.service';
import {inject} from '@angular/core';
import {HttpInterceptorFn} from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const adminRoutes = [
    '/admin',
    '/ResponseDm/locataires',
    '/ResponseDm/valider',
    '/ResponseDm/apercu-contrat',
    '/DemandeLocationCM/all-demande-client',
    '/DemandeLocationCM/admin',
  ];

  const isAdminRoute = adminRoutes.some(route => req.url.includes(route));
  const token = isAdminRoute
    ? localStorage.getItem('admin_token')
    : authService.getToken();

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  return next(req);
};
