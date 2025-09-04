# Instrucciones de Restauración

## Información del Backup
- **Fecha:** 4/9/2025, 2:35:54 p. m.
- **Proyecto:** Alerta Educativa
- **Supabase URL:** https://zahqnkjkyltsthfczzgp.supabase.co

## Para Restaurar en Caso de Problemas

### 1. Restaurar Esquema de Base de Datos
```bash
# Conectar a Supabase y ejecutar los archivos en orden:
psql -d tu_base_datos -f complete-database-schema.sql
psql -d tu_base_datos -f teacher-auxiliary-rls-policies.sql
psql -d tu_base_datos -f admin-director-rls-policies.sql
```

### 2. Revertir Cambios en Git
```bash
# Ver commits recientes
git log --oneline -10

# Revertir al commit anterior (reemplazar HASH con el commit anterior)
git revert HASH

# O hacer rollback completo
git reset --hard HASH
git push --force-with-lease origin main
```

### 3. Verificar Restauración
```bash
# Ejecutar verificaciones
node scripts/verify-deployment.js
```

## Contacto de Emergencia
En caso de problemas críticos:
1. Ejecutar los pasos de restauración arriba
2. Verificar logs de Supabase
3. Contactar al equipo de desarrollo

---
**Backup creado automáticamente el 4/9/2025, 2:35:54 p. m.**
