<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Internal links go through `@/components/app-link` (href-based); add a path to its `builtRoutes` set when its route file exists, so unbuilt pages stay plain links until then.
- Colour tokens in `src/styles.css` stay hex: `src/test/mwenge/contrast.test.ts` parses them for WCAG checks.
