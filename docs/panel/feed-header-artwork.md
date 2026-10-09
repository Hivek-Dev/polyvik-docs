# Feed header artwork

> **Retired on 9 Oct 2026.** The Feed dropped its editorial header for a clean
> layout (see [design-system.md](design-system.md)). The images stay in
> `public/images/feed/`, which the login screen still uses. This page is kept as
> the record of how they were made.

## Current version: coral, golden yellow and cobalt

The current header combines [fashion-editorial-v2.jpg](../../../polyvik-panel/public/images/feed/fashion-editorial-v2.jpg), [citrus-studio-v3.jpg](../../../polyvik-panel/public/images/feed/citrus-studio-v3.jpg), and the restored [chrome-bloom-v1.jpg](../../../polyvik-panel/public/images/feed/chrome-bloom-v1.jpg). The portrait anchors the brand coral; the perfume introduces warm golden yellow related to Brasa amber; the blue flower supplies cool contrast with an amber center connecting it to the warm palette. The pixel background and primary color are unchanged. The list lives in `HEADER_ARTWORK` in [`src/pages/Feed.tsx`](../../../polyvik-panel/src/pages/Feed.tsx); layout and motion are described in [design-guide.md](design-guide.md#feed).

The perfume was edited with the built-in image-generation tool on 2026-09-25 from `citrus-studio-v2.jpg` (removed 26 Sep 2026). Web export: 540 × 720 JPEG, quality 84. Final prompt:

Use case: precise-object-edit. Asset type: premium editorial product photograph for a website header. Input image is the edit target. Change only the color palette of this exact photograph: make the large circular backdrop a sunny warm golden-yellow, approximately #FFC84A, from the same warm amber family as brand color #FFB14A. It should read clearly YELLOW, not orange and not greenish lemon or neon. Make the perfume glass and liquid luminous pale honey-gold with golden-yellow refracted highlights instead of the current coral-orange. Preserve the exact bottle silhouette, spherical chrome cap, blood orange fruit, ivory stone plinth, circular backdrop geometry, camera angle, crop, lighting direction and all texture. Keep the blood orange fruit's natural red-orange flesh, pale ivory surroundings and neutral silver cap. Maintain premium realistic material separation and beautiful natural shadows, no overall yellow filter. This image will sit between a coral-orange fashion portrait and a cobalt-blue chrome flower: its yellow color must offer a distinct warm accent that harmonizes with coral-orange #FF5A36 and amber #FFB14A. Preserve portrait 3:4 composition. No text, logos, frames, watermark or added objects.

## Previous version: Brasa color harmony (v2)

Edited with the built-in image-generation tool on 2026-09-25. These earlier variations are retained for comparison. Shared dominant hue: coral-orange #ff5a36, with amber #ffb14a highlights and terracotta shadows. Skin, ivory and silver remain natural. Geometry and the stepped layout are preserved. Web exports: 540 × 720 JPEG, quality 84.

### fashion-editorial v2

Input: `fashion-editorial-v1.jpg` (removed 26 Sep 2026)

Saved asset: [fashion-editorial-v2.jpg](../../../polyvik-panel/public/images/feed/fashion-editorial-v2.jpg)

Final edit prompt:

Edit this supplied image only to harmonize its colors with the Polyvik Brasa brand palette. This is one of three adjacent header photographs against a pixelated coral/orange background. The shared dominant hue must be coral-orange #ff5a36, warm highlights #ffb14a, and understated dark terracotta shadows. Preserve the exact subject, identity, geometry, crop, framing, light direction, fine texture and premium editorial quality. No text, logo, frame, added objects, watermarks or new composition. Preserve a 3:4 portrait format. Keep material separation and realistic texture, not a flat orange filter. Retain the exact same adult woman's face, haircut, pose and reflective sunglasses. Change only the jacket's dominant orange to the brand's vivid coral-orange #ff5a36, and harmonize the background to a richer, darker version of that same hue so the jacket stays distinct. Preserve natural skin color, black hair and neutral silver sunglasses; do not apply an orange wash to the skin.

### citrus-studio v2

Input: `citrus-studio-v1.jpg` (removed 26 Sep 2026)

Saved asset: `citrus-studio-v2.jpg` (removed 26 Sep 2026)

Final edit prompt:

Edit this supplied image only to harmonize its colors with the Polyvik Brasa brand palette. This is one of three adjacent header photographs against a pixelated coral/orange background. The shared dominant hue must be coral-orange #ff5a36, warm highlights #ffb14a, and understated dark terracotta shadows. Preserve the exact subject, identity, geometry, crop, framing, light direction, fine texture and premium editorial quality. No text, logo, frame, added objects, watermarks or new composition. Preserve a 3:4 portrait format. Keep material separation and realistic texture, not a flat orange filter. Preserve the exact bottle silhouette, chrome cap, fruit, stone plinth and circular backdrop motif. Shift the orange circle to coral-orange #ff5a36, and shift the glass and fruit's dominant orange toward that same warm coral hue with golden #ffb14a highlights. Preserve the pale ivory background and stone, neutral metallic cap, glass translucency, realistic refracted light and natural blood-orange flesh. The result should harmonize with a coral orange brand, not be predominantly yellow.

### chrome-bloom v2

Input: [chrome-bloom-v1.jpg](../../../polyvik-panel/public/images/feed/chrome-bloom-v1.jpg)

Saved asset: `chrome-bloom-v2.jpg` (removed 26 Sep 2026)

Final edit prompt:

Edit this supplied image only to harmonize its colors with the Polyvik Brasa brand palette. This is one of three adjacent header photographs against a pixelated coral/orange background. The shared dominant hue must be coral-orange #ff5a36, warm highlights #ffb14a, and understated dark terracotta shadows. Preserve the exact subject, identity, geometry, crop, framing, light direction, fine texture and premium editorial quality. No text, logo, frame, added objects, watermarks or new composition. Preserve a 3:4 portrait format. Keep material separation and realistic texture, not a flat orange filter. Replace the entire blue backdrop and blue floor with a seamless saturated coral-orange #ff5a36 studio setting, including the darker orange contact shadow. Keep the flower's exact five inflated petals, center, curved stem and pose. Keep the petals and stem polished SILVER CHROME with neutral bright highlights and physically believable warm coral reflections from the new environment. The central glass sphere remains luminous amber #ffb14a. Remove all cobalt/blue casts. Do not turn the chrome into copper or gold.

## Original generation (v1)

Generated with the built-in image-generation tool on 2026-09-25. These are decorative Polyvik inspiration images, independent of the active brand's gallery. The existing pixel background is preserved. All three final web assets are optimized JPEGs at 540 × 720 px, quality 84, retaining their original portrait composition.

### fashion-editorial

Asset: `fashion-editorial-v1.jpg` (removed 26 Sep 2026)

Final generation prompt:

Use case: ads-marketing. Create a unique premium fashion editorial photograph for a tiny portrait card in the header of Polyvik, a modern creative studio app aimed at young adult creators. One fictional adult female fashion model, age 25, sculptural short dark hair, reflective silver wraparound sunglasses and an oversized tangerine technical jacket. Confident three-quarter head and shoulder portrait, face fully visible in upper middle, high-end magazine campaign art direction, real skin texture, sharp fabric detail, powerful hard studio side lighting, monochromatic rich burnt-orange seamless background. Clean strong silhouette that reads at 166 pixels wide. Portrait 3:4 composition, centered subject, full bleed. Only the photograph: no text, logos, borders, collage or watermark. Professional, youthful and striking, not cartoonish.

### chrome-bloom

Asset: [chrome-bloom-v1.jpg](../../../polyvik-panel/public/images/feed/chrome-bloom-v1.jpg)

Final generation prompt:

Use case: stylized-concept. Create a unique premium art-directed 3D still life for a tiny portrait card in the header of Polyvik, a modern creative studio app aimed at young adult creators. One sculptural flower with five inflated polished chrome petals and a small orange glass spherical center, a curved chrome stem, floating diagonally against a deep ultramarine blue seamless studio backdrop. Sophisticated reflective metal, clean bright silver highlights with subtle warm orange reflections, believable ray-traced lighting and soft shadow. Designer collectible sculpture, bold playful silhouette, luxury experimental editorial campaign. Portrait 3:4 composition, centered large flower occupying 75 percent of the frame and instantly readable at 166 pixels wide. Only the artwork: no text, logos, borders, collage, watermark, extra objects or confetti.

### citrus-studio

Asset: `citrus-studio-v1.jpg` (removed 26 Sep 2026)

Final generation prompt:

Use case: product-mockup. Create a unique professional beauty campaign photograph for the foremost portrait card in the header of Polyvik, a modern creative studio app aimed at young adult creators. A single unbranded sculptural translucent tangerine-orange perfume bottle with a round chrome cap, standing on a pale warm ivory stone plinth, one cut blood orange half resting beside it. Background warm ivory with a large vivid orange circular spotlight creating a graphic eclipse behind the bottle. Museum-quality product photography, elegant editorial composition, crisp glass edges, luminous refracted orange caustics, believable fine condensation, premium soft and hard studio lighting, grounded sharp shadow. Portrait 3:4 composition, the whole bottle centered and large occupying 65 percent of frame, all essential details in the middle 75 percent to allow a UI crop. Clean, confident and expensive. Only the photograph: absolutely no text, labels, logos, frames, collage, watermark or extra products.
