// scripts/agent.ts
import fs from 'fs';
import { writeFileSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TODO_PATH = path.resolve(__dirname, '../docs/TODO.md');
const STATUS_PATH = path.resolve(__dirname, '../docs/STATUS.md');
const CHANGELOG_PATH = path.resolve(__dirname, '../docs/CHANGELOG.md');

// === UTILS ===
const readFile = (p: string) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
const writeFile = (p: string, content: string) => fs.writeFileSync(p, content, 'utf8');
const appendFile = (p: string, content: string) => fs.appendFileSync(p, content + '\n', 'utf8');

// === AJOUT : Détection et génération de test UI ===

function isUITask(task: string): boolean {
  const uiKeywords = ['UI', 'interface', 'affichage', 'bouton', 'visuel', 'clic', 'badge', 'composant'];
  return uiKeywords.some(kw => task.toLowerCase().includes(kw));
}

function getCodexPromptForUITest(componentName: string, behavior: string) {
  return `
# Mission
G\u00e9n\u00e8re un fichier de test UI automatique en TypeScript utilisant @testing-library/react.

## Composant concern\u00e9
Nom : ${componentName}

## Comportement attendu
${behavior}

## Contraintes
- Utiliser un fichier .test.tsx
- Simuler les interactions utilisateur (clics, changements d\u2019\u00e9tat)
- Ajouter une gestion de timeout pour \u00e9viter les tests bloqu\u00e9s (ex: jest.setTimeout(5000))
- Utiliser des assertions claires
- Ne pas inclure d'import inutile

# Exemple :
import { render, screen, fireEvent } from '@testing-library/react';
jest.setTimeout(5000);

// ... test code ici ...
`;
}

async function fetchCodexCompletion(prompt: string): Promise<string> {
  // Stub – to be replaced with real Codex call
  return `// Codex output for: ${prompt}`;
}

// Appel Codex (stub à remplacer si Codex branché en local ou API)
async function generateUITestFile(task: string, componentName: string) {
  const prompt = getCodexPromptForUITest(componentName, task);
  const output = await fetchCodexCompletion(prompt); // <- remplacer avec ta logique Codex
  const filename = `__tests__/${componentName}.test.tsx`;
  writeFileSync(filename, output, 'utf-8');
  console.log(`✅ Test g\u00e9n\u00e9r\u00e9 : ${filename}`);
}

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

  if (isUITask(task.task)) {
    const component = task.task.split(' ')[1] || 'Component'; // Ex: "Fix badge UI"
    await generateUITestFile(task.task, component);
  }

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
