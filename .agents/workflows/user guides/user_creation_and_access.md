# User Creation & Access Management Guide

## 1. Overview
The **User Creation & Access Management** system handles the complete lifecycle of onboarding a new user into Logistech. It integrates two independent permission layers — **Databricks App Access** (CAN_USE) and **Internal Role-Based Access** (users/roles/entities) — into a single, automated workflow. When an administrator creates a user, the system searches the corporate Entra ID directory, provisions the user in the internal database with mandatory role and entity assignments, and automatically grants access to the Databricks App — all in one operation.

## 2. Two-Layer Permission Architecture

The app enforces a dual-layer security model:

| Layer | Purpose | Where it lives | What it controls |
|-------|---------|----------------|------------------|
| **Databricks App Access** | Gate to the application | Databricks workspace permissions | Whether the user can even open the app (CAN_USE) |
| **Internal Roles** | Authorization within the app | `users`, `user_roles` tables | What the user can see and do inside the app |

> **Critical**: Without `CAN_USE` in Databricks, the user cannot reach the application at all — internal roles are irrelevant until this gate is passed.

## 3. User Creation Flow

The full creation process follows a strict 4-step sequence:

```
Búsqueda Entra ID → Asignación de Rol/Entidad → INSERT en DB → Grant CAN_USE en Databricks
```

### 3.1. Step 1: Entra ID Search (SCIM)

In Databricks mode, the system queries the workspace SCIM API to find users from the corporate Active Directory:

- **API**: `GET /api/2.0/preview/scim/v2/Users?filter=displayName+co+"{query}"+or+userName+co+"{query}"`
- **Authentication**: OAuth token from the app's service principal
- **Result**: Returns `email`, `full_name`, `given_name`, `family_name`, `phone`, `active` status
- **Duplicate Check**: Each result is cross-checked against the `users` table; duplicates are flagged with `already_exists: true` and cannot be re-created

> In **DuckDB mode** (local development), Entra ID search is disabled. Users are created manually with free-text email and name fields.

### 3.2. Step 2: Role & Entity Assignment (Mandatory)

When creating a new user, the administrator **must** assign:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre Completo | ✅ (auto-filled from Entra ID) | Read-only in Databricks mode |
| Correo Electrónico | ✅ (auto-filled from Entra ID) | Read-only in Databricks mode, used as SSO identifier |
| Idioma | ✅ | Defines the user's interface language |
| Entidad | ✅ | The organizational entity (e.g., CLN, CLE) |
| Rol | ✅ | The role within that entity (e.g., Resolver, Aprobador) |
| Teléfono | Opcional | Contact number |

> **Design Decision**: Saving a user without at least one role/entity assignment is **blocked** by both frontend validation and backend validation (`400 Bad Request`). This prevents orphan users with no functional access.

### 3.3. Step 3: Database Provisioning

The backend performs two atomic inserts:

1. **`users` table**: Creates the user record with `default_entity_code` and `default_role` populated.
2. **`user_roles` table**: Creates the initial role-entity assignment with `is_default = true`.

The `default_entity_code` and `default_role` determine the user's starting context when they log into the app.

### 3.4. Step 4: Automatic CAN_USE Grant (Databricks only)

Immediately after database provisioning, the system calls the Databricks Permissions API:

- **API**: `PATCH https://{host}/api/2.0/permissions/apps/logistech`
- **Payload**:
  ```json
  {
    "access_control_list": [
      { "user_name": "user@epiroc.com", "permission_level": "CAN_USE" }
    ]
  }
  ```
- **Authentication**: OAuth token from the app's service principal
- **Behavior**: Non-blocking — if the grant fails, the user is still created in the database. A warning toast is displayed to the administrator with the specific error.

## 4. Prerequisites (One-Time Setup)

For the Entra ID search and automatic CAN_USE grant to work, the following must be configured **once** by a workspace admin:

### 4.1. Service Principal in `admins` Group (SCIM API)

The app's service principal (`app-2avlzw logistech`, ID: `142362435402359`) **must** be a member of the workspace `admins` group to access the SCIM API for user search.

> **Without this, the Entra ID search in admin/general will fail silently or return no results.**

**How to verify:**
```bash
databricks api get "/api/2.0/preview/scim/v2/Groups/837256084874728" --profile DEFAULT
```
Check that `members` includes `"display": "app-2avlzw logistech"`.

**How to configure (if missing):**
```bash
databricks api patch /api/2.0/preview/scim/v2/Groups/837256084874728 --json @patch.json --profile DEFAULT
```
With `patch.json`:
```json
{
  "schemas": ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
  "Operations": [
    {
      "op": "add",
      "value": {
        "members": [{ "value": "142362435402359" }]
      }
    }
  ]
}
```

### 4.2. Service Principal App Permissions (CAN_USE Grant)

The app's dedicated service principal (`app-2avlzw logistech`) must have **Can Manage** permission on the app itself.

**How to configure:**
1. Navigate to Databricks Workspace → Apps → `logistech` → Permissions
2. In the "Select user, group or service principal..." field, search for `app-2avlzw logistech`
3. Set the permission level to **Can Manage**
4. Click **Add**, then **Save**

### 4.3. Azure AD Group Sync

The SCIM search only returns users that are **provisioned in the Databricks workspace**. Users are synced from Azure AD via the group:

- **Group Name**: `EIT_ASG_Databricks_dbx-supplychain-sam-datamart-weeu-dev-001_User`
- **Databricks Group ID**: `577460259327776`
- **Sync Type**: Automatic (Azure AD → Databricks SCIM provisioning)
- **Sync Delay**: Typically **5–40 minutes** after adding a member in Azure AD

> **Important**: If a user doesn't appear in the Entra ID search, verify they are a member of this Azure AD group and wait for sync propagation.

**How to verify a user is synced:**
```bash
databricks api get "/api/2.0/preview/scim/v2/Users?filter=userName+eq+%22user.name%40epiroc.com%22" --profile DEFAULT
```

### 4.4. Environment Variables

| Variable | Value | Where |
|----------|-------|-------|
| `DATABRICKS_APP_NAME` | `logistech` | `app.yaml` |
| `DATABRICKS_HOST` | `adb-1520628986248469.9.azuredatabricks.net` | `app.yaml` |
| `DB_TYPE` | `databricks` | `app.yaml` |

## 5. API Endpoints

### 5.1. Search Entra ID Users

**Request**: `GET /api/admin/users/search-entra?q=eduardo`

**Response**:
```json
[
  {
    "scim_id": "abc123",
    "email": "eduardo.acuna@epiroc.com",
    "full_name": "Eduardo Acuna Fernandez",
    "given_name": "Eduardo",
    "family_name": "Acuna Fernandez",
    "phone": null,
    "active": true,
    "already_exists": false
  }
]
```

### 5.2. Create User

**Request**: `POST /api/admin/users`

**Body**:
```json
{
  "email": "eduardo.acuna@epiroc.com",
  "full_name": "Eduardo Acuna Fernandez",
  "phone": null,
  "language_id": 1,
  "default_entity_code": "CLN",
  "default_role": 3
}
```

**Response (201)**:
```json
{
  "message": "Usuario creado exitosamente",
  "id": 5,
  "user_id": 5,
  "app_access_granted": true
}
```

**Response (201, with CAN_USE failure)**:
```json
{
  "message": "Usuario creado exitosamente",
  "id": 5,
  "user_id": 5,
  "app_access_granted": false,
  "app_access_warning": "El usuario fue creado pero no se pudo otorgar acceso CAN_USE automáticamente. Error: Permissions API error: 403 - ..."
}
```

## 6. Error Handling

| Escenario | HTTP | Comportamiento |
|-----------|------|----------------|
| Campos obligatorios faltantes | `400` | Blocked, no insert |
| Email duplicado | `409` | Blocked, existing user detected |
| CAN_USE grant falla | `201` | User created, warning toast shown |
| SCIM API falla | `500` | Search returns error, no user creation |
| DB insert falla | `500` | Full rollback, no partial state |

## 7. Step-by-Step: Adding a New User (Administrator Guide)

### Prerequisite: Ensure the user is in the Azure AD group

1. Go to **Azure Portal** → **Groups** → search for `EIT_ASG_Databricks_dbx-supplychain-sam-datamart-weeu-dev-001_User`
2. Click **Members** → **Add members**
3. Search for the user and add them
4. **Wait 5–40 minutes** for the sync to propagate to the Databricks workspace

### Create the user in Logistech

1. Open Logistech → **Configuración** → **General** → tab **Usuarios**
2. In the **"Buscar en directorio corporativo (Entra ID)"** field, type the user's name or email
3. Select the user from the dropdown (users marked "Ya existe" are already in the system)
4. The form auto-fills with the user's name and email (read-only)
5. Select the **Idioma**, **Entidad** and **Rol** for the user
6. Optionally, enter a phone number
7. Click **Crear Usuario**
8. The system will:
   - Insert the user in the database
   - Assign the initial role/entity
   - Automatically grant `CAN_USE` on the Databricks App
9. A success toast confirms the creation. If CAN_USE failed, a warning toast appears with instructions.

### Post-creation: Additional role/entity assignments

After creation, use the **Roles de Usuario** tab to assign additional role/entity combinations to the user.

## 8. Troubleshooting

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| La búsqueda Entra ID no devuelve resultados para ningún usuario | El Service Principal de la app no es miembro del grupo `admins` del workspace | Ver sección 4.1 para añadir el SP al grupo admins |
| Un usuario específico no aparece en la búsqueda | El usuario no está sincronizado al workspace de Databricks | Verificar que está en el grupo Azure AD (sección 4.3) y esperar 5-40 min |
| La búsqueda devuelve error 501 | La app está corriendo en modo DuckDB local | Verificar `DB_TYPE=databricks` en `app.yaml` |
| CAN_USE grant falla con 403 | El SP no tiene permiso "Can Manage" en la app | Ver sección 4.2 |
| El usuario se creó pero no puede abrir la app | CAN_USE no se otorgó (warning toast ignorado) | Otorgar manualmente desde Databricks → Apps → logistech → Permissions |
| Error "SCIM API error" en los logs del servidor | Token OAuth expirado o Service Principal sin permisos | Reiniciar la app (stop/start) para renovar el token; verificar grupo admins |

### Verificación rápida desde CLI

```bash
# Verificar si un usuario está provisionado en el workspace
databricks api get "/api/2.0/preview/scim/v2/Users?filter=userName+eq+%22email%40epiroc.com%22" --profile DEFAULT

# Verificar si el SP está en el grupo admins
databricks api get "/api/2.0/preview/scim/v2/Groups/837256084874728" --profile DEFAULT

# Verificar el estado de la app
databricks apps get logistech --profile DEFAULT

# Reiniciar la app (si hay problemas de token)
databricks apps stop logistech --profile DEFAULT
databricks apps start logistech --profile DEFAULT
```

## 9. Architecture Notes

- **Service Layer**: `server/services/entra.service.ts` contains `searchEntraUsers()` (SCIM integration) and `grantAppAccess()` (Permissions API).
- **Controller**: `server/controllers/adminController.ts` exposes `createAdminUser`, `searchEntraIdUsers`, and other CRUD handlers.
- **Routes**: `GET /api/admin/users/search-entra` and `POST /api/admin/users` registered in `server/routes/index.ts`.
- **Frontend**: `client/src/pages/admin/GeneralConfig.tsx` manages the user creation form under the "Usuarios" tab of the Configuración page.
- **Search Component**: `client/src/components/admin/EntraUserSearch.tsx` handles the debounced SCIM search dropdown.
- **DB Layer**: `server/db/db.ts` provides `getOAuthToken()` (OAuth client credentials flow) and `resolveDatabricksHost()` used by SCIM and Permissions APIs.
- **App Config**: `app.yaml` defines runtime environment variables including `DATABRICKS_APP_NAME`.
- **Key IDs**:
  - Workspace `admins` group: `837256084874728`
  - Azure AD sync group (workspace): `577460259327776`
  - App Service Principal ID: `142362435402359`
  - App Service Principal name: `app-2avlzw logistech`
