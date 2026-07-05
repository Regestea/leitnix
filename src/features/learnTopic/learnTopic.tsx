import { useState } from "react";
import MainContainer from "../../shared/components/MainContainer";
import MarkdownEditor from "../../shared/components/MarkdownEditor";
import MarkdownRender from "../../shared/components/MarkdownRender";
import Tabs from "../../shared/components/Tabs";
import { Button } from "../../shared/components/controls/Button";


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
erDiagram

    USER {
        int id
        string firstName
        string lastName
        string email
        string passwordHash
        string phone
        datetime createdAt
    }

    ADDRESS {
        int id
        int userId
        string country
        string city
        string street
        string postalCode
    }

    CATEGORY {
        int id
        string name
        int parentId
    }

    BRAND {
        int id
        string name
    }

    PRODUCT {
        int id
        int categoryId
        int brandId
        string name
        string description
        decimal price
        bool isActive
    }

    PRODUCT_IMAGE {
        int id
        int productId
        string url
        bool isPrimary
    }

    PRODUCT_VARIANT {
        int id
        int productId
        string sku
        string color
        string size
        decimal price
    }

    INVENTORY {
        int id
        int variantId
        int quantity
    }

    CART {
        int id
        int userId
        datetime createdAt
    }

    CART_ITEM {
        int id
        int cartId
        int variantId
        int quantity
    }

    ORDER {
        int id
        int userId
        int addressId
        decimal total
        string status
        datetime createdAt
    }

    ORDER_ITEM {
        int id
        int orderId
        int variantId
        decimal price
        int quantity
    }

    PAYMENT {
        int id
        int orderId
        decimal amount
        string method
        string status
        datetime paidAt
    }

    SHIPMENT {
        int id
        int orderId
        string carrier
        string trackingCode
        string status
    }

    REVIEW {
        int id
        int userId
        int productId
        int rating
        string comment
    }

    WISHLIST {
        int id
        int userId
    }

    WISHLIST_ITEM {
        int id
        int wishlistId
        int productId
    }

    COUPON {
        int id
        string code
        decimal discount
        datetime expiresAt
    }

    ORDER_COUPON {
        int orderId
        int couponId
    }

    USER ||--o{ ADDRESS : has
    USER ||--|| CART : owns
    USER ||--o{ ORDER : places
    USER ||--|| WISHLIST : owns
    USER ||--o{ REVIEW : writes

    CATEGORY ||--o{ PRODUCT : contains
    BRAND ||--o{ PRODUCT : makes

    PRODUCT ||--o{ PRODUCT_IMAGE : has
    PRODUCT ||--o{ PRODUCT_VARIANT : has
    PRODUCT ||--o{ REVIEW : receives
    PRODUCT ||--o{ WISHLIST_ITEM : saved

    PRODUCT_VARIANT ||--|| INVENTORY : stock
    PRODUCT_VARIANT ||--o{ CART_ITEM : selected
    PRODUCT_VARIANT ||--o{ ORDER_ITEM : purchased

    CART ||--o{ CART_ITEM : contains

    ORDER ||--|{ ORDER_ITEM : contains
    ORDER ||--|| PAYMENT : paid_by
    ORDER ||--|| SHIPMENT : shipped_by
    ORDER ||--o{ ORDER_COUPON : uses

    COUPON ||--o{ ORDER_COUPON : applied

    WISHLIST ||--o{ WISHLIST_ITEM : contains
\`\`\``,

    `## نقل قول چند خطی

> Clean Architecture
>
> Dependency Inversion
>
> Domain Driven Design`,

    `پایان نمونه کامل Markdown 🎉`,
  ];


export default function LearnTopic() {
  const [markdown, setMarkdown] = useState(markdownSections.join("\n\n---\n\n"));

  return (
    <MainContainer>
      <div style={{ overflow: "scroll", height: "80dvh" }}>
        <Tabs
          tabs={[
            {
              id: "view",
              label: "View",
              content: <MarkdownRender markdown={markdown} />,
            },
            {
              id: "edit",
              label: "Edit",
              content: (
                <MarkdownEditor value={markdown} onChange={setMarkdown} />
              ),
            },
          ]}
        />
      </div>
      <Button style={{width:'100%',marginTop:'2rem'}} label="Generate Questions" />
    </MainContainer>
  );
}
