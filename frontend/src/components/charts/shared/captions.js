/**
 * Compute one-line, plain-English insight captions for each chart from the same stats
 * data the charts render — so every visual is annotated with what it shows.
 * @param {object} stats - The /api/insights/stats response.
 * @returns {Record<string, string>}
 */
export function computeCaptions(stats) {
  if (!stats) return {};
  const captions = {};

  const { byYear = [], byRegion = [], byTopic = [], byCountry = [], bySector = [] } = stats;

  if (byYear.length) {
    const peak = byYear.reduce((a, b) => ((b.avgIntensity ?? 0) > (a.avgIntensity ?? 0) ? b : a));
    captions.trend = `Average intensity peaks around ${peak.year} (${peak.avgIntensity}).`;
  }

  if (byRegion.length) {
    captions.region = `${byRegion[0].region} has the most insights (${byRegion[0].count}).`;
  }

  if (byTopic.length) {
    captions.topic = `"${byTopic[0].topic}" is the most-covered topic (${byTopic[0].count} insights).`;
  }

  if (byCountry.length) {
    captions.country = `${byCountry[0].country} leads with ${byCountry[0].count} insights.`;
  }

  if (bySector.length) {
    const combined = bySector.reduce((a, b) => {
      const sa = (a.avgIntensity ?? 0) + (a.avgLikelihood ?? 0);
      const sb = (b.avgIntensity ?? 0) + (b.avgLikelihood ?? 0);
      return sb > sa ? b : a;
    });
    captions.sector = `${combined.sector} shows the highest combined intensity and likelihood.`;
  }

  return captions;
}

export default computeCaptions;
