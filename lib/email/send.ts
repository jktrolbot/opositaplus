import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Oposita+ <noreply@opositaplus.es>';

export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: '¡Bienvenido a Oposita+!',
    html: `
      <h1>¡Hola ${name}!</h1>
      <p>Bienvenido a Oposita+. Tu cuenta ha sido creada correctamente.</p>
      <p>Ya puedes empezar a preparar tus oposiciones con nuestras herramientas de IA.</p>
      <p><a href="https://opositaplus.es/oposiciones">Empezar ahora →</a></p>
    `,
  });
}

export async function sendInviteEmail(to: string, centerName: string, role: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Has sido invitado a ${centerName} en Oposita+`,
    html: `
      <h1>Invitación a ${centerName}</h1>
      <p>Has sido invitado como <strong>${role}</strong> en ${centerName}.</p>
      <p><a href="https://opositaplus.es/registro">Crear cuenta y unirte →</a></p>
    `,
  });
}

export async function sendSubscriptionConfirmation(to: string, planName: string, centerName: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Suscripción confirmada: ${planName}`,
    html: `
      <h1>¡Suscripción activa!</h1>
      <p>Tu suscripción al plan <strong>${planName}</strong> en ${centerName} está activa.</p>
      <p>Ya tienes acceso completo a todos los recursos y herramientas.</p>
    `,
  });
}

export async function sendClassReminder(to: string, className: string, startsAt: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Recordatorio: ${className} empieza pronto`,
    html: `
      <h1>Clase en breve</h1>
      <p>Tu clase <strong>${className}</strong> comienza el ${new Date(startsAt).toLocaleString('es-ES')}.</p>
      <p><a href="https://opositaplus.es">Acceder a la clase →</a></p>
    `,
  });
}
