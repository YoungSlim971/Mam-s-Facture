// scripts/agent.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TODO_PATH = path.resolve(__dirname, '../docs/TODO.md');
const STATUS_PATH = path.resolve(__dirname, '../docs/STATUS.md');
const CHANGELOG_PATH = path.resolve(__dirname, '../docs/CHANGELOG.md');

// === UTILS ===
const readFile = (p: string) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
const writeFile = (p: string, content: string) => fs.writeFileSync(p, content, 'utf8');
const appendFile = (p: string, content: string) => fs.appendFileSync(p, content + '\n', 'utf8');

// === PARSE TO-DO ===
function extractTasks(todoText: string): { section: string, task: string }[] {
  const tasks: { section: string, task: string }[] = [];
  let currentSection = '';
  for (const line of todoText.split('\n')) {
    if (line.startsWith('##')) currentSection = line.replace(/[#\s]/g, '');
    if (line.startsWith('- [ ]')) tasks.push({ section: currentSection, task: line.replace('- [ ] ', '') });
  }
  return tasks;
}

// === MAIN EXEC ===
async function run() {
  const todoText = readFile(TODO_PATH);
  const statusText = readFile(STATUS_PATH);
  const tasks = extractTasks(todoText);

  if (tasks.length === 0) {
    console.log('✅ Aucune tâche à exécuter.');
    return;
  }

  const task = tasks[0];
  const branch = `auto/${task.section.toLowerCase()}-${task.task.toLowerCase().replace(/\s+/g, '-')}`;

  console.log(`🚀 Lancement de la tâche : ${task.task}`);
  execSync(`git checkout -b ${branch}`);

  // Simule une action (à remplacer par ton implémentation réelle)
  appendFile(CHANGELOG_PATH, `- ✅ ${task.task} [${task.section}]`);
  console.log(`✅ Tâche "${task.task}" marquée comme traitée.`);

  // Met à jour le TODO.md
  const updatedTodo = todoText.replace(`- [ ] ${task.task}`, `- [x] ${task.task}`);
  writeFile(TODO_PATH, updatedTodo);

  // Commit & push
  execSync(`git add .`);
  execSync(`git commit -m "auto: ${task.task} [${task.section}]"`);
  execSync(`git push origin ${branch}`);
  execSync(`gh pr create --title "✅ ${task.task}" --body "PR automatique pour la tâche : ${task.task}"`);
}

run().catch(console.error);
