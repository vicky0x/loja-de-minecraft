/**
 * Formata um nome de produto que está em formato de slug para um formato legível
 * Exemplo: "minecraft-java-bedrock-edition-original-completo" -> "Minecraft Java Bedrock Edition Original Completo"
 */
export function formatProductName(name: string): string {
  if (!name) return '';
  
  return name
    .replace(/-/g, ' ') // substituir hífens por espaços
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalizar primeira letra de cada palavra
    .join(' ') // juntar novamente
    .replace(/\s+\(copia\)/gi, ' (Cópia)') // formatar "copia" para "Cópia" com espaço antes
    .replace(/\s+copia\s+\d+/gi, (match) => { // formatar "copia 1234" para "Cópia 1234"
      return match.replace(/copia/i, 'Cópia');
    });
} 