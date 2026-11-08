/** Client-safe auth helpers (no server imports). */

export function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  const label =
    score >= 85
      ? "Strong"
      : score >= 55
        ? "Medium"
        : score >= 30
          ? "Weak"
          : "Very weak";
  return { score: Math.min(score, 100), label };
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function passwordChecks(password: string) {
  return [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "One letter", ok: /[A-Za-z]/.test(password) },
    { label: "One number", ok: /[0-9]/.test(password) },
    { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
    {
      label: "One special character",
      ok: /[^A-Za-z0-9]/.test(password),
    },
  ];
}
