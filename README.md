# OpenBible

Leitor e companheiro de estudo bíblico offline-first dentro do Obsidian. Interface em Svelte.

> Status: recomeço (v0.1.0). Estrutura base com view Svelte funcional; leitura de capítulos, múltiplas versões e referências cruzadas — herdados do projeto anterior — serão reintroduzidos aos poucos.

## Recursos

- Leitura de capítulos com numeração de versículos
- Seletor de livros com busca e filtro por testamento
- Troca de versões/traduções
- Navegação entre capítulos (anterior/próximo)
- Referências cruzadas no painel de recursos
- 100% local e offline (SQLite via WebAssembly)

## Instalação

1. Baixe `main.js`, `manifest.json` e `styles.css` da [Release](https://github.com/open-mission/obsidian-open-bible/releases).
2. Crie a pasta `<vault>/.obsidian/plugins/open-bible/` e copie os arquivos para ela.
3. Recarregue o Obsidian e ative **OpenBible** em Configurações → Plugins da comunidade.

## Desenvolvimento

Pré-requisitos: Node.js ≥ 18.

```bash
npm install
npm run dev           # watch → gera main.js
npm run build         # type-check + bundle de produção
npm run svelte-check  # checagem de tipos Svelte
```

Use um vault de teste, nunca o vault principal.

### Internacionalização (i18n)

Todo texto de interface é resolvido pela função `t()`, com dicionários em `src/i18n/`:

- `src/i18n/store.svelte.ts` — estado reativo com runes (`$state`) e a API pública: `t()`, `setLocale()`, `getLocale()`, `detectObsidianLocale()`, `applyLocalePreference()`.
- `src/i18n/types.ts` — contratos `TranslationStrings`, `SupportedLocale` e `LocalePreference`.
- `src/i18n/locales/en.ts` / `pt.ts` — dicionários; as duas chaves devem permanecer em paridade.
- `src/i18n/index.ts` — barrel público (`import { t } from "../i18n"`).

O dicionário contém **apenas as chaves em uso** pela interface atual. Ao portar uma feature nova,
adicione a chave nos dois idiomas no mesmo commit que passa a usá-la (o tipo `TranslationStrings`
mantém os dicionários sincronizados).

```svelte
<script lang="ts">
	import { t } from "../i18n";
</script>

<button>{t("common.save")}</button>
```

Chaves usam notação de ponto (`settings.languageSettingName`) e aceitam placeholders:
`t("settings.importSuccessNotice", { name: "ARA" })`. Chaves desconhecidas caem para o inglês
e, em último caso, retornam a própria chave.

Como `t()` lê o estado reativo do módulo, qualquer componente que a chame durante a renderização
é atualizado automaticamente quando o idioma muda. O idioma é escolhido em
**Configurações → OpenBible → Idioma**; a opção `auto` segue o idioma do Obsidian.

## Licença

[MIT](LICENSE).

Dados de referências cruzadas: [OpenBible.info](https://www.openbible.info/labs/cross-references/) (CC-BY).
