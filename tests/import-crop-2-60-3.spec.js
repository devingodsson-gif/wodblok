// 2.60.3 (owner Oct 27 2026): Shapes > Import, Single shape: a crop on the picture, beside the Threshold; only the ink inside it is traced.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const SHOT = process.env.WB_SHOT;
test('a drag on the picture crops what is traced; its corner pulls it; a click takes the whole picture again', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await page.setInputFiles('#ifile', 'tests/fixtures/picture.png');
  await expect(page.locator('#idlg')).toBeVisible();
  await expect(page.locator('#iinfo')).toContainText('part');
  const whole = await page.locator('#iinfo').textContent();
  const b = await page.locator('#sov').boundingBox(), at = (fx, fy) => [b.x + b.width * fx, b.y + b.height * fy];
  const drag = async (a, z) => { await page.mouse.move(...a); await page.mouse.down(); await page.mouse.move(...z, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(150); };
  // the left third has no ink in this picture
  await drag(at(.02, .05), at(.3, .95));
  await expect(page.locator('#sov .crln')).toHaveCount(1);
  await expect(page.locator('#iinfo')).toHaveText(/No ink found/);
  await expect(page.locator('#iadd')).toBeDisabled();
  // pull its lower right corner over the ink
  const h = await page.locator('#sov [data-crh="se"]').boundingBox();
  await drag([h.x + h.width / 2, h.y + h.height / 2], at(.98, .95));
  await expect(page.locator('#iinfo')).toContainText('part');
  if (SHOT) await page.screenshot({ path: SHOT });
  // a click: the whole picture again
  await page.mouse.click(...at(.5, .5)); await page.waitForTimeout(150);
  await expect(page.locator('#sov .crln')).toHaveCount(0);
  await expect(page.locator('#iinfo')).toHaveText(whole);
  expect(errors).toEqual([]);
});
