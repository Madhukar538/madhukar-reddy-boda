# Draft post: One site, twelve looks

Paste into **Admin → Posts → New post**. Review the wording before publishing; every number below is from the real build.

- **Title:** One Site, Twelve Looks: Themes That Change the Layout, Not Just the Colours
- **Slug:** one-site-twelve-looks
- **Category:** Software Architecture
- **Tags:** Next.js, Design Systems, Accessibility, Performance, Claude Code
- **Excerpt:** dhucar.in now ships twelve looks, and eleven of them change the page itself, not just its colours: a departures board, a VHS tape, a newspaper, a till receipt, a star atlas. How they stay readable, fast and tested: one look in the page at a time, an accessibility scan on every pull request, and a byte budget instead of a Lighthouse score.

---

## Content (HTML)

```html
<p class="lead">Most theme switchers change colours. The page underneath stays the same: same cards, same grid, same hero, painted differently. I wanted the opposite. On dhucar.in, picking a look changes what the page <em>is</em>.</p>

<p>There are twelve now. Midnight is the classic layout. Each of the other eleven has its own homepage and its own Experience, About and Projects pages: the projects are a railway departures board in Arctic, cassettes on a shelf in Synthwave, numbered plates in a book in Dune, a stack of till receipts in Receipt, a constellation in Observatory, and packs on a shop shelf, each with a <strong>Project Facts</strong> panel, in Bazaar.</p>

<h2>Start from an object, not a palette</h2>

<p>The first versions of the new looks were colour swaps, and they looked generated: gradient text, soft glows, blurred blobs behind everything. What fixed that was giving each look a real object to imitate, and letting the object decide the layout:</p>

<ul>
<li><strong>Arctic</strong> is Swiss transit signage: a twelve-column hairline grid, line badges, the projects on an amber dot-matrix departures board.</li>
<li><strong>Synthwave</strong> is a tape on a CRT: scanlines, a one-pixel colour slip on the headline, the projects as cassettes whose reels turn on hover.</li>
<li><strong>Gazette</strong> is a broadsheet: masthead, a lead story in justified columns, a classified ad for bugs to fix.</li>
<li><strong>Receipt</strong> is a thermal till slip with a torn edge: projects as line items, numbers as totals, a barcode.</li>
<li><strong>Terminal</strong> is a shell session: <code>whoami</code>, <code>ls ~/projects</code>, <code>git log</code> for the experience, a man page for About.</li>
</ul>

<p>The same data feeds every look: the projects, the experience, the posts and the About answers come from the API once. A look is only a different set of components over that data.</p>

<h2>One look in the page at a time</h2>

<p>The first implementation rendered every look's blocks into every page and hid all but one with CSS. It worked, and the homepage weighed <strong>523 KB of HTML</strong> (108 KB compressed) to show one of them.</p>

<p>Pages are static, and the visitor's choice lives in their browser, so the server can only ever know the default look. Now the server renders just that one, and a small client switcher loads any other look's code on demand, in its own chunk:</p>

<pre class="language-tsx">const load = {
  arctic: { home: () =&gt; import('./arctic-home').then((m) =&gt; m.ArcticHome), pages: () =&gt; import('./arctic-pages') },
  gazette: { home: () =&gt; import('./gazette').then((m) =&gt; m.GazetteHome), pages: () =&gt; import('./gazette') },
  // …one entry per look
};</pre>

<p>The homepage went from 523 KB to <strong>214 KB</strong> (40.5 KB compressed). Taking the animation library off pages that didn't need it, by replacing two shared-layout animations with a measured CSS slide, cut the homepage's scripts from 252 KB to 204 KB.</p>

<blockquote><p>[!tip] Measure bytes, not scores</p><p>CI weighs the first load of the main pages, compressed, by kind, and fails a pull request that goes over budget. Lighthouse timings move between runs on shared machines; bytes don't. Repeated runs gave identical numbers.</p></blockquote>

<h2>Twelve looks means twelve chances to break</h2>

<p>A CSS change for one look can quietly break another, so every pull request now opens six pages in all twelve looks, at desktop and phone widths: 144 page loads. It fails if a page loses its look, a look's own blocks aren't on screen, a phone page scrolls sideways, or the browser logs an error. It saves a screenshot of every page in every look, so reviewing a design change means flipping through images, not clicking a theme menu twelve times.</p>

<p>It also runs an accessibility scan (WCAG 2 A and AA) on every page in every look. The first run found only one kind of problem, and plenty of it: text contrast. Glass's blue, <code>#007BFF</code>, was 3.97:1 on white; it is <code>#0066CC</code> now. Editorial's signal orange stays <code>#FF4D00</code> for fills, but large text set in it uses a deeper <code>#EB4700</code>, which clears the 3:1 that large type needs.</p>

<p>The check paid for itself within a day. On the CI machine's fonts one code block in a post was wider than its column and scrolled sideways, and a keyboard can't reach a scroll area with nothing focusable in it. My own machine's fonts were narrower, so it had passed locally. Every code block and wide table in a post is focusable now.</p>

<h2>The bug the looks uncovered</h2>

<p>Building a 404 for each look turned up an old bug: on the 404, every visitor saw the default look, whatever they had picked. Next renders a missing page as an error shell that is built in the browser, where the layout's inline theme script never runs. The theme provider now applies the saved look on load when the page doesn't already have it, which is a no-op everywhere else.</p>

<h2>Which looks do people pick?</h2>

<p>The privacy-first page-view counter now also records which look a page was shown in, keeping it only if it is a real theme name, on the same anonymous record: no cookie, no id. The admin dashboard shows it as <strong>Themes in use</strong>, and the default look will follow what visitors actually choose rather than what I like best.</p>

<p>Try it: the palette button in the menu, <strong>Surprise me</strong> at the bottom of it, or press <kbd>T</kbd> anywhere to switch to the next look.</p>
```
