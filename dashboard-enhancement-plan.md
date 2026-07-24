# 青云高级中学仪表盘 — 插图与动效增强计划

> 在 `school-dashboard-v4.html` 基础上追加日式校园风格插图和多层次交互动效。

## 当前基线

- `school-dashboard-v4.html` — 1455 行，含 SplitEngine 逐字动画、日式留白、柔化配色、完整 CRUD 交互
- 设计系统：`--accent: #0ea5e9` (天空蓝)，Inter 字体，16px 圆角，64px hero padding

---

## 一、插图计划（3 个点位）

### 1.1 Hero 主视觉插画

**位置**：Hero 区域右侧，替代现有 motif SVG  
**规格**：  
- 尺寸：约 400×400px，透明背景 PNG  
- 风格：日式校园 flat illustration — 类似 7-kou.jp 的学生/校园场景，柔和线条 + 扁平色块  
- 内容：一名学生正在学习的场景（书桌 + 书本 + 窗外校园景色），主色调为天空蓝 + 暖米色 + 草木绿  
- 生成模型：`flux-pro-ultra`  
- 文件名：`assets/hero-illustration.png`

**布局**：Hero 使用 `display: grid; grid-template-columns: 1fr auto`，文字在左，插画在右

---

### 1.2 空状态插图（3 张）

**位置**：数据空白面板中（今日考勤空、暂无公告、暂无排课）  
**规格**：  
- 尺寸：约 200×160px，透明背景 PNG  
- 风格：与 hero 插画同系列，更简化、更小  
- 内容：
  1. `assets/empty-attendance.png` — 时钟 + 空教室场景
  2. `assets/empty-announcement.png` — 公告板 + 信封
  3. `assets/empty-timetable.png` — 课程表 + 粉笔
- 生成模型：`flux-pro-ultra`

**布局**：居中放置于 `.panel-empty` 中，替代当前 SVG 图标

---

### 1.3 侧边栏品牌插画

**位置**：侧边栏底部，学校 logo 下方  
**规格**：  
- 尺寸：约 160×120px，透明背景 PNG  
- 风格：同系列，更偏品牌装饰 — 学校建筑剪影 + 樱花枝  
- 内容：青云高级中学建筑轮廓 + 一两朵樱花  
- 生成模型：`flux-pro-ultra`  
- 文件名：`assets/sidebar-brand.png`

**布局**：侧边栏底部固定，`margin-top: auto`，半透明呈现

---

## 二、动效计划（4 类）

实现方式：**纯 Vanilla JS + CSS**（不引入外部动画库），与现有 SplitEngine 保持一致。

### 2.1 数字跳动（Number Counter）

**触发**：进入仪表盘页面时，指标卡数值从 0 计数到目标值  
**实现**：  
```js
function countUp(el, target, duration = 1200) {
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
```
**适用元素**：6 张 `.metric-card-value` 中的数值（1,284 / 32 / 87.3 / 98.5 / 42.8 / 7）

---

### 2.2 页面切换过渡（Page Transition）

**触发**：点击侧边栏/子标签切换页面时  
**实现**：CSS `@view-transition` 或手动 fade + slide  
```css
.page { opacity: 0; transform: translateY(12px); transition: all 0.3s cubic-bezier(0.2,0,0,1); }
.page.active { opacity: 1; transform: translateY(0); }
```
**细节**：  
- 仪表盘 → 班级管理：内容区淡入 + 微上移  
- 班级管理 → 课表：同上  
- 延迟：切换时先隐藏旧页，再显示新页（顺序过渡）

---

### 2.3 Hover 微交互增强

**现有**：指标卡 `translateY(-2px)` + `box-shadow`  
**追加**：  
- 指标卡：hover 时图标轻微放大 `scale(1.08)` + 底色加深  
- 课表格子：hover 时 2px 边框高亮 + `brightness(0.94)`（已有）  
- 表格行：hover 时左侧 3px 细线指示（`border-left` 变色）  
- 按钮：`active` 时 `scale(0.97)` 按压反馈  
- 侧边栏 nav item：hover 时左侧 3px accent 指示线从透明滑入

---

### 2.4 Toast 通知动效

**现有**：顶部居中 `translateY(-8px)` 滑入  
**追加**：  
- 入场：`scale(0.9) → 1` + `translateY(-12px) → 0`，`cubic-bezier(0.34, 1.56, 0.64, 1)` 弹性缓出  
- 退场：2s 后 `opacity → 0` + `translateY(-4px)`，0.2s  
- 新增 toast 类型：success（绿色）、error（红色），每种有对应 SVG 图标

---

## 三、工序

| 步骤 | 内容 | 产出 |
|---|---|---|
| 1 | 生成 Hero 主视觉插画 | `assets/hero-illustration.png` |
| 2 | 生成 3 张空状态插画 | `assets/empty-*.png` |
| 3 | 生成侧边栏品牌插画 | `assets/sidebar-brand.png` |
| 4 | 更新 HTML 嵌入图片 + 调整布局 | `school-dashboard-v4.html` 更新 |
| 5 | 实现数字跳动引擎 `countUp()` | JS 新增 ~30 行 |
| 6 | 实现页面切换过渡 CSS + JS | CSS 更新 + JS 逻辑 |
| 7 | 增强 Hover 微交互 | CSS 更新多处 |
| 8 | 增强 Toast 动画 | CSS + JS 更新 |
| 9 | 自检 + 预览导出 | 通过 scorecard |

---

## 四、开放问题

- [ ] 空状态插图是否需要包含文字？还是纯图形 + 下方文字？→ 当前计划：纯图形 + 下方保留现有文字
- [ ] Hero 插画在移动端是否隐藏？→ 计划：≤768px 时隐藏插画，仅保留文字
- [ ] 数字跳动在每次切换回仪表盘时都重新播放？→ 计划：首次进入播放，切换回时也播放（体验更好）

---

## 五、下一步

1. **审阅此计划** — 确认插图内容、动效范围、开放问题的答案
2. **回复「开始」或「执行计划」** — 我会按工序 1→9 依次执行
3. 或 **编辑此 .md 文件** — 直接修改计划内容，我按修改后的执行
