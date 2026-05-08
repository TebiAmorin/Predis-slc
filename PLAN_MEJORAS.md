# Plan de Mejoras — Predicciones BLAST R6 Major SLC 2026

## Fase 1: Integración de datos automáticos

### 1.1 Liquipedia API (Partidos y resultados)
- **Qué**: Obtener automáticamente los partidos, horarios y resultados del Major desde Liquipedia
- **Cómo**: Usar la API de MediaWiki de Liquipedia (`liquipedia.net/rainbowsix/api.php`) para parsear la página del torneo
- **Endpoints útiles**:
  - `action=parse&page=BLAST_Major/2026/May` — HTML parseado de la página del torneo
  - `action=query&prop=revisions` — Detectar cambios en la página (polling)
- **Limitaciones**: Rate limit estricto (1 req/30s para bots), requiere User-Agent con contacto
- **Implementación**:
  - Crear un cron job (Vercel Cron o Supabase Edge Function) que cada 5 minutos consulte cambios
  - Parsear el HTML para extraer bracket, resultados, y horarios
  - Actualizar la tabla `matches` automáticamente cuando se detecten resultados nuevos
  - Notificar al admin por email/webhook cuando hay actualizaciones pendientes de confirmar

### 1.2 Siege.gg API (Estadísticas de equipos)
- **Qué**: Enriquecer la información de equipos con stats (win rate, map pool, head-to-head)
- **Cómo**: Siege.gg tiene una API no documentada públicamente; alternativa es scraping con permisos
- **Datos útiles**: Win rate reciente, mapa más jugado, racha actual, H2H entre equipos
- **Implementación**:
  - Crear tabla `team_stats` en Supabase con campos para métricas clave
  - Mostrar estadísticas en la card de cada partido para ayudar a los usuarios a predecir
  - Actualizar diariamente mediante Edge Function

### 1.3 Alternativa: SiegeGG/R6Tracker RSS/embeds
- Si no hay API accesible, embeber widgets o usar RSS feeds para mostrar info contextual
- Links directos a perfiles de equipos en Siege.gg desde cada match card

---

## Fase 2: Mejoras de UX/UI

### 2.1 Sistema de notificaciones
- Push notifications (web) cuando un partido va a empezar (15 min antes)
- Notificación cuando se publican resultados de un partido que el usuario predijo
- Usar Service Worker + Web Push API

### 2.2 Estadísticas del usuario
- Dashboard personal con gráficos: tasa de acierto por fase, por equipo, evolución temporal
- Comparación con otros usuarios del leaderboard
- Badges/logros (primer acierto, racha de 5, predijo al campeón, etc.)

### 2.3 Predicciones avanzadas
- Predicción de score exacto (bonus points)
- Predicción del campeón del torneo (antes de que empiece)
- Predicción de MVP del torneo
- Sistema de confianza: apostar más puntos en predicciones seguras

### 2.4 Social features
- Comentarios en cada partido
- Reacciones rápidas durante partidos en vivo
- Mini-chat o feed de actividad en la página /live
- Compartir predicciones individuales (no solo el resumen general)

---

## Fase 3: Infraestructura y escalabilidad

### 3.1 Real-time updates
- Supabase Realtime para actualizar scores en vivo sin refresh
- WebSocket connection en /live para push de cambios de score
- Optimistic UI para predicciones (instant feedback)

### 3.2 Caché y performance
- ISR (Incremental Static Regeneration) para páginas que no necesitan ser full dynamic
- Redis/KV cache para leaderboard (evitar recalcular en cada request)
- Edge middleware para servir contenido más rápido

### 3.3 Multi-torneo
- Generalizar el esquema de DB para soportar múltiples torneos
- Tabla `tournaments` con metadatos (nombre, fechas, formato, región)
- Permitir al usuario ver su historial por torneo
- Preparar para SI 2027, regionales, etc.

---

## Prioridad de implementación

| Prioridad | Tarea | Esfuerzo | Impacto |
|-----------|-------|----------|---------|
| 🔴 Alta | Liquipedia auto-update de resultados | Medio | Muy alto |
| 🔴 Alta | Supabase Realtime en /live | Bajo | Alto |
| 🟡 Media | Stats de Siege.gg en match cards | Alto | Medio |
| 🟡 Media | Notificaciones push | Medio | Alto |
| 🟡 Media | Stats personales del usuario | Medio | Alto |
| 🟢 Baja | Predicción de campeón | Bajo | Medio |
| 🟢 Baja | Sistema de badges | Medio | Medio |
| 🟢 Baja | Multi-torneo | Alto | Alto (futuro) |
