import "./App.css";
import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faCog
} from "@fortawesome/free-solid-svg-icons";
import useModal from "../shared/hooks/useModal.ts";
import Modal from "../shared/components/Modal.tsx";
import { useThemeStore, type ThemeName } from "../shared/store/themeStore.ts";
import { Outlet } from "react-router";
import MarkdownRender from "../shared/components/MarkdownRender.tsx";
import Nav from "../shared/components/Nav.tsx";

function App() {
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { theme, setTheme } = useThemeStore();

  const settingsSidebarRef = useRef<HTMLDivElement>(null);
  const settingsToggleRef = useRef<HTMLButtonElement>(null);


  function handleSidebarToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setSidebarOpen((prev) => !prev);
  }


  const { isOpen, open, close } = useModal();

  const markdownSections: string[] = [
    `# 🚀 نمونه کامل Markdown

## تیترها

# Heading 1
## Heading 2
### Heading 3`,

    `## متن ساده

این یک متن معمولی است.

**متن بولد**

*متن ایتالیک*

***بولد و ایتالیک***

~~متن خط خورده~~

> این یک نقل قول است.`,

    `## لیست‌ها

### لیست نامرتب

- مورد اول
- مورد دوم
  - زیرمورد 1
  - زیرمورد 2

### لیست مرتب

1. آیتم اول
2. آیتم دوم
3. آیتم سوم

### Task List

- [x] یادگیری React
- [x] یادگیری .NET
- [ ] یادگیری AI`,

    `## لینک و تصویر

[OpenAI](https://openai.com)

![Sample Image](https://picsum.photos/300/150)`,

    `## جدول بزرگ نمونه

| ID | نام | نام خانوادگی | سن | جنسیت | شهر | کشور | شغل | سابقه کار | زبان اصلی | ایمیل | وضعیت |
|----|-----|--------------|----|--------|------|--------|------|-----------|------------|--------|--------|
| 1 | Amir | Mahmood Pour | 28 | Male | Tehran | Iran | .NET Developer | 5 Years | Persian | amir@example.com | Active |
| 2 | Sara | Ahmadi | 25 | Female | Shiraz | Iran | UI/UX Designer | 3 Years | Persian | sara@example.com | Active |
| 3 | Ali | Mohammadi | 30 | Male | Isfahan | Iran | DevOps Engineer | 7 Years | Persian | ali@example.com | Active |
| 4 | Reza | Karimi | 32 | Male | Tabriz | Iran | Backend Developer | 8 Years | Persian | reza@example.com | Inactive |
| 5 | Maryam | Hosseini | 27 | Female | Mashhad | Iran | Frontend Developer | 4 Years | Persian | maryam@example.com | Active |
| 6 | Nima | Ebrahimi | 29 | Male | Karaj | Iran | QA Engineer | 5 Years | Persian | nima@example.com | Active |
| 7 | Fatemeh | Jalali | 31 | Female | Ahvaz | Iran | Product Manager | 6 Years | Persian | fatemeh@example.com | Active |
| 8 | Arman | Rahimi | 26 | Male | Qom | Iran | Mobile Developer | 3 Years | Persian | arman@example.com | Pending |`,

    `## کد Inline

برای نصب پکیج از دستور \`npm install\` استفاده کنید.`,

    `## کد C#

\`\`\`csharp
using System;

public class Program
{
    public static void Main()
    {
        Console.WriteLine("Hello World");

        var numbers = new[] { 1, 2, 3, 4, 5 };

        var evenNumbers = numbers
            .Where(x => x % 2 == 0)
            .ToList();

        Console.WriteLine(string.Join(", ", evenNumbers));
    }
}
\`\`\``,

    `## کد TypeScript

\`\`\`ts
interface User {
    id: number;
    name: string;
}

const user: User = {
    id: 1,
    name: "Amir"
};

console.log(user);
\`\`\``,

    `## کد JSON

\`\`\`json
{
    "name": "Amir",
    "skills": [
        ".NET",
        "React",
        "Docker"
    ]
}
\`\`\``,

    `## فرمول‌های ریاضی (KaTeX / MathJax)

فرمول درون‌خطی:

$E = mc^2$

فرمول بلوکی:

$$
a^2 + b^2 = c^2
$$`,

    `## فرمول‌های پیشرفته

انتگرال:

$$
\\int_{0}^{1} x^2 dx = \\frac{1}{3}
$$

مشتق:

$$
\\frac{d}{dx}(x^2) = 2x
$$

ماتریس:

$$
\\begin{bmatrix}
1 & 2 \\\\
3 & 4
\\end{bmatrix}
$$`,

    `## فیزیک

قانون دوم نیوتن:

$$
F = ma
$$

قانون اهم:

$$
V = IR
$$

انرژی:

$$
E = mc^2
$$

گرانش:

$$
F = G \\frac{m_1 m_2}{r^2}
$$`,

    `## متن رنگی (HTML)

<span style="color:red">متن قرمز</span>

<span style="color:green">متن سبز</span>

<span style="color:blue">متن آبی</span>`,

    `## HTML داخل Markdown

<div style="padding:10px;border:1px solid gray;border-radius:8px;">
  این یک Box HTML است.
</div>`,

    `## جدول با ایموجی

| Skill | Level |
|---------|---------|
| C# | ⭐⭐⭐⭐⭐ |
| React | ⭐⭐⭐ |
| Docker | ⭐⭐⭐⭐ |
| Azure | ⭐⭐⭐ |`,

    `## Mermaid Diagram

\`\`\`mermaid
graph TD
A[Client] --> B[API]
B --> C[Database]
B --> D[Redis]
\`\`\``,

    `## نقل قول چند خطی

> Clean Architecture
>
> Dependency Inversion
>
> Domain Driven Design`,

    `پایان نمونه کامل Markdown 🎉`,
  ];

  return (
    <>
      <button className="home-btn" onClick={open}>
        <FontAwesomeIcon icon={faHome} />
      </button>

      <button
        ref={settingsToggleRef}
        className="settings-toggle"
        onClick={handleSidebarToggle}
      >
        <FontAwesomeIcon icon={faCog} />
      </button>

      <div
        ref={settingsSidebarRef}
        className={`settings-sidebar${sidebarOpen ? " active" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
        </div>
        <div className="settings-field">
          <label className="settings-label">Theme</label>
          {/* ✅ value و onChange آپدیت شدن */}
          <select
            className="custom-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeName)}
          >
            <option value="Dark">Dark</option>
            <option value="Light">Light</option>
            <option value="TomorrowNight">Tomorrow Night</option>
          </select>
        </div>
      </div>

      <div className="main-wrapper">
        <Outlet />
      </div>

      <Nav/>


      <Modal isOpen={isOpen} onClose={close} title="Theme">
        {markdownSections.map((item) => (
          <div style={{"overflow":"auto"}}>
            <MarkdownRender markdown={item} />
          </div>
        ))}
      </Modal>
    </>
  );
}

export default App;
