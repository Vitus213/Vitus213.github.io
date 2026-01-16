import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = '/home/vitus/Documents/posts';
const TARGET_DIR = path.join(__dirname, '../src/content/blog');

// 月份映射
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 转换日期格式: "2024-07-11 20:55:00" -> "Jul 11 2024"
function formatDate(dateStr) {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return undefined;
  const month = MONTHS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day} ${year}`;
}

// 解析 markdown frontmatter（兼容 Windows 换行符 \r\n）
function parseFrontmatter(content) {
  // 先规范化换行符
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();

    // 处理数组格式的 tags
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim().replace(/'/g, '').replace(/"/g, '')).filter(v => v);
    }

    frontmatter[key] = value;
  }

  return frontmatter;
}

// 生成新的 frontmatter
function generateFrontmatter(frontmatter, category) {
  const lines = ['---'];

  if (frontmatter.title) lines.push(`title: "${frontmatter.title}"`);
  if (frontmatter.description) lines.push(`description: "${frontmatter.description}"`);

  // 转换日期
  const date = formatDate(frontmatter.published);
  if (date) lines.push(`date: "${date}"`);

  // updated 字段
  const updated = formatDate(frontmatter.updated);
  if (updated && updated !== date) lines.push(`updated: "${updated}"`);

  // tags 数组
  if (frontmatter.tags && Array.isArray(frontmatter.tags) && frontmatter.tags.length > 0) {
    lines.push(`tags: [${frontmatter.tags.map(t => `"${t}"`).join(', ')}]`);
  }

  // category
  if (category) lines.push(`category: "${category}"`);

  // draft
  if (frontmatter.draft) lines.push(`draft: ${frontmatter.draft}`);

  lines.push('---');
  return lines.join('\n');
}

// 获取分类名称
function getCategory(dirPath) {
  const dirName = path.basename(dirPath);
  if (dirName === 'posts') return null; // 根目录
  return dirName;
}

// 递归查找所有 markdown 文件
function findMarkdownFiles(dir, category = null) {
  const files = [];

  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 检查是否是分类目录（包含子目录如 CS, BLOCKCHAIN 等）
      const subCategory = getCategory(fullPath);
      files.push(...findMarkdownFiles(fullPath, subCategory || category));
    } else if (item.endsWith('.md')) {
      files.push({ path: fullPath, category });
    }
  }

  return files;
}

// 转义 YAML 字符串中的特殊字符
function escapeYamlString(str) {
  if (!str) return '';
  // 转义双引号中的特殊字符
  return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// 重新生成 frontmatter，更安全的方式
function generateNewFrontmatter(frontmatter, category) {
  const lines = ['---'];

  if (frontmatter.title) {
    lines.push(`title: "${escapeYamlString(frontmatter.title)}"`);
  }
  if (frontmatter.description) {
    lines.push(`description: "${escapeYamlString(frontmatter.description)}"`);
  }

  const date = formatDate(frontmatter.published);
  if (date) lines.push(`date: "${date}"`);

  const updated = formatDate(frontmatter.updated);
  if (updated && updated !== date) lines.push(`updated: "${updated}"`);

  if (frontmatter.tags && Array.isArray(frontmatter.tags) && frontmatter.tags.length > 0) {
    lines.push(`tags: [${frontmatter.tags.map(t => `"${t}"`).join(', ')}]`);
  }

  if (category) lines.push(`category: "${category}"`);

  if (frontmatter.draft === 'true' || frontmatter.draft === true) {
    lines.push(`draft: true`);
  }

  lines.push('---');
  return lines.join('\n');
}

// 主迁移函数
function migrate() {
  const markdownFiles = findMarkdownFiles(SOURCE_DIR);
  console.log(`找到 ${markdownFiles.length} 篇文章`);

  let successCount = 0;
  let skipCount = 0;

  for (const { path: filePath, category } of markdownFiles) {
    const fileName = path.basename(filePath, '.md');
    const dirPath = path.dirname(filePath);

    // 目标文件夹名
    const targetFolderName = fileName;
    const targetFolder = path.join(TARGET_DIR, targetFolderName);
    const targetFile = path.join(targetFolder, 'index.md');

    // 检查是否已存在
    if (fs.existsSync(targetFile)) {
      console.log(`跳过: ${fileName} (已存在)`);
      skipCount++;
      continue;
    }

    try {
      // 读取原文
      const content = fs.readFileSync(filePath, 'utf-8');
      const frontmatter = parseFrontmatter(content);

      if (!frontmatter) {
        console.log(`跳过: ${fileName} (无 frontmatter)`);
        continue;
      }

      // 创建目标文件夹
      fs.mkdirSync(targetFolder, { recursive: true });

      // 生成新的 frontmatter
      const newFrontmatter = generateNewFrontmatter(frontmatter, category);

      // 提取正文（去掉原 frontmatter），兼容 Windows 换行符
      const normalizedContent = content.replace(/\r\n/g, '\n');
      const bodyContent = normalizedContent.replace(/^---\n[\s\S]*?\n---\n?/, '');

      // 写入新文件
      fs.writeFileSync(targetFile, newFrontmatter + '\n\n' + bodyContent);

      // 复制 assets 文件夹（如果存在）
      const assetsFolder = path.join(dirPath, `${fileName}.assets`);
      if (fs.existsSync(assetsFolder)) {
        const targetAssets = path.join(targetFolder, `${fileName}.assets`);
        fs.cpSync(assetsFolder, targetAssets, { recursive: true });
        console.log(`  复制 assets: ${fileName}.assets`);
      }

      // 复制 cover 图片（如果存在且是相对路径）
      if (frontmatter.cover && !frontmatter.cover.startsWith('http')) {
        const coverPath = path.join(dirPath, path.basename(frontmatter.cover));
        if (fs.existsSync(coverPath)) {
          fs.copyFileSync(coverPath, path.join(targetFolder, path.basename(coverPath)));
          console.log(`  复制 cover: ${path.basename(coverPath)}`);
        }
      }

      console.log(`✓ 迁移: ${fileName} (category: ${category || 'none'})`);
      successCount++;
    } catch (err) {
      console.error(`✗ 失败: ${fileName}`, err.message);
    }
  }

  console.log(`\n完成！成功: ${successCount}, 跳过: ${skipCount}`);
}

migrate();
