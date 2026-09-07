const translatedMessages: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User already registered": "Já existe uma conta com esse e-mail.",
  "Password should be at least 6 characters": "A senha não atende ao tamanho mínimo.",
  "New password should be different from the old password.":
    "Escolha uma senha diferente da atual.",
};

export function userMessage(error: unknown) {
  if (error instanceof Error) return translatedMessages[error.message] ?? error.message;
  return "Não foi possível concluir a operação. Tente novamente.";
}
