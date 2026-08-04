# 成绩管理 + 登录权限 实施计划

> **Goal:** 新增成绩管理模块 + 真实登录权限系统，补考试→成绩闭环，让系统支持多角色使用

**Architecture:** JWT token认证 + bcrypt密码哈希 + 角色权限控制(admin/teacher)。成绩模块关联考试→场次→班级→学生→科目，支持录入+分析。

**Tech Stack:** jsonwebtoken, bcryptjs (server); React Context + React Router (frontend)

---

### Task 1: Server — 用户表 + JWT 认证系统

**Files:**
- Modify: `server/db.cjs` — 加 users 表 + seed
- Modify: `server/index.cjs` — 加 /api/auth/login, /api/auth/me, JWT 中间件

### Task 2: Server — 考试成绩表 + API

**Files:**
- Modify: `server/db.cjs` — 加 exam_scores 表
- Modify: `server/index.cjs` — 加 /api/scores CRUD + 批量导入

### Task 3: Frontend — 类型 + API

**Files:**
- Modify: `src/types/index.ts` — 加 User, ExamScore 接口
- Modify: `src/api/index.ts` — 加 auth + scores API 函数

### Task 4: Frontend — AuthContext + Login 页面

**Files:**
- Create: `src/pages/Login/index.tsx`
- Modify: `src/contexts/PermissionContext.tsx` → 替换为真实 AuthContext
- Modify: `src/main.tsx` — 登录/主应用分流
- Modify: `src/App.tsx` — 路由守卫

### Task 5: Frontend — 成绩录入页面

**Files:**
- Create: `src/pages/ScoreEntry/index.tsx`
- Modify: `src/App.tsx` — 加路由
- Modify: `src/layouts/MainLayout.tsx` — 加菜单项

### Task 6: Frontend — 成绩分析页面

**Files:**
- Create: `src/pages/ScoreAnalysis/index.tsx`
- Modify: `src/App.tsx` — 加路由
- Modify: `src/layouts/MainLayout.tsx` — 加菜单项

### Task 7: 验证 — 完整构建+端到端测试

**Files:** 无新建，验证所有改动
