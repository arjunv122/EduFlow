$envVars = @{
    "MONGODB_URI" = "mongodb+srv://eduflow:adhiarjun122@cluster0.bd2ku64.mongodb.net/eduflow?appName=Cluster0"
    "JWT_SECRET" = "eduflow_super_secret_jwt_key_2026_change_in_production"
    "JWT_EXPIRES_IN" = "7d"
    "SMTP_HOST" = "smtp.gmail.com"
    "SMTP_PORT" = "587"
    "SMTP_USER" = "arjunv12214@gmail.com"
    "SMTP_PASS" = "iblt mpod rtpu iuiy"
    "EMAIL_FROM" = "EduFlow <noreply@eduflow.com>"
    "FRONTEND_URL" = "https://frontend-murex-chi-99.vercel.app"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    npx vercel env add $key production --value "$value" --yes --force
}
