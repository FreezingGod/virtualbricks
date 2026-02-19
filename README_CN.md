# VirtualBricks

[English](./README.md)

基于 React、Three.js 和 TypeScript 构建的网页版积木搭建模拟器。

## 功能特性

### 积木搭建
- **45+ 种积木类型**: 标准砖块、板材、斜坡 (33°/45°/65°)、圆形积木、圆锥
- **网格对齐**: 自动对齐到标准积木网格系统
- **连接检测**: 凸点与凹槽之间的智能吸附
- **碰撞检测**: 防止积木重叠放置
- **颜色选择**: 47+ 种颜色可选

### 工具
- **放置工具**: 向场景中添加新积木
- **选择工具**: 点击选择，Shift+点击多选
- **删除工具**: 从场景中移除积木
- **旋转**: 放置前按 `R` 键旋转积木

### 存储与导出
- **本地存储**: 使用 IndexedDB 保存/加载项目
- **JSON 导入/导出**: 备份和分享项目
- **LDraw 导出**: 导出为行业标准 .ldr 格式（兼容 BrickLink Studio、LeoCAD、LDView）

### 渲染
- **PBR 材质**: 逼真的塑料外观，正确的粗糙度/金属度
- **阴影**: 动态阴影投射和接收
- **倒角边缘**: 真实的积木边缘倒角

## 技术栈

- **React 18** - UI 框架
- **Three.js / React Three Fiber** - 3D 渲染
- **Rapier** - 物理引擎 (WASM)
- **Zustand** - 状态管理
- **TypeScript** - 类型安全
- **Vite** - 构建工具

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone git@github.com:FreezingGod/virtualbricks.git
cd virtualbricks

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

在浏览器中打开 http://localhost:5173

### 生产构建

```bash
npm run build
npm run preview
```

## 项目结构

```
src/
├── components/
│   ├── canvas/          # 3D 渲染组件
│   │   ├── LegoCanvas.tsx
│   │   ├── BrickMesh.tsx
│   │   ├── GhostBrick.tsx
│   │   └── PhysicsBrick*.tsx
│   └── ui/              # UI 组件
│       ├── Toolbar.tsx
│       ├── PartsPalette.tsx
│       ├── ColorPicker.tsx
│       └── SaveLoadDialog.tsx
├── core/
│   ├── brick/           # 积木系统
│   │   ├── BrickRegistry.ts
│   │   └── BrickGeometry.ts
│   ├── connection/      # 吸附检测
│   ├── collision/       # 碰撞检测
│   └── constants/       # 积木尺寸常量
├── exporters/           # 文件格式导出器
│   └── LDrawExporter.ts
├── services/            # 存储服务
│   └── StorageService.ts
├── store/               # Zustand 状态存储
└── types/               # TypeScript 类型定义
```

## 积木尺寸

模拟器使用标准积木尺寸：

| 测量项 | 数值 |
|--------|------|
| 凸点间距 | 8.0 mm |
| 凸点直径 | 4.8 mm |
| 凸点高度 | 1.6 mm |
| 板材高度 | 3.2 mm |
| 砖块高度 | 9.6 mm (3 个板材高度) |
| LDU 换算 | 1 LDU = 0.4 mm |

## 键盘快捷键

| 按键 | 功能 |
|------|------|
| `R` | 旋转积木（放置模式下） |
| `Ctrl+S` | 保存项目 |
| `Ctrl+O` | 加载项目 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` | 重做 |
| `Delete` | 删除选中的积木 |

## 开发路线图

- [ ] **科技系统**: 横梁、轴、销钉、齿轮
- [ ] **马达模拟**: 动力功能
- [ ] **物理模拟**: 重力、碰撞
- [ ] **搭建说明书**: 分步骤 PDF 导出
- [ ] **更多积木类型**: 拱形、楔形、侧向凸点积木

## 参与贡献

欢迎贡献代码！请随时提交 Pull Request。

## 开源协议

本项目基于 MIT 协议开源，详情如下：

```
MIT License

Copyright (c) 2024 VirtualBricks

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 致谢

- [LDraw.org](https://www.ldraw.org/) - CAD 标准和零件库
- [BrickLink](https://www.bricklink.com/) - 颜色参考
- [Three.js](https://threejs.org/) - 3D 图形库
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) - Three.js 的 React 渲染器
