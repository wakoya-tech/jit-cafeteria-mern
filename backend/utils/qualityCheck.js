/**
 * Real delivery QA — pass only if objective checks succeed (SRS Appendix A-2 enhanced).
 */
export function evaluateInspection(data) {
  const reasons = [];

  if (data.mold) reasons.push('Mold detected');
  if (data.damage) reasons.push('Physical damage');
  if (data.discoloration) reasons.push('Discoloration');
  if (data.bad_smell) reasons.push('Bad smell');

  if (data.temperature_celsius != null && data.temperature_celsius !== '') {
    const t = Number(data.temperature_celsius);
    if (data.item_category === 'injera' || data.item_category === 'hot_food') {
      if (t < 50) reasons.push(`Temperature too low (${t}°C — hot food should be ≥50°C)`);
    } else if (t > 8) {
      reasons.push(`Cold storage too warm (${t}°C — should be ≤8°C)`);
    }
  }

  const ordered = Number(data.quantity_ordered ?? data.quantity);
  const counted = Number(data.quantity_counted ?? data.injera_count ?? data.quantity);
  if (ordered > 0 && counted < ordered * 0.95) {
    reasons.push(`Short delivery: counted ${counted}, invoice ${ordered}`);
  }

  if (data.weight_verified === false) {
    reasons.push('Weight not verified against delivery note');
  }

  if (data.item_category === 'injera' && (!data.injera_count || data.injera_count <= 0)) {
    reasons.push('Injera count required — count pieces before accepting');
  }

  const passed = reasons.length === 0 && data.passed !== false;
  return { passed, reasons, visual_defects: reasons.some((r) => r.includes('Mold') || r.includes('damage') || r.includes('Discoloration')) };
}
