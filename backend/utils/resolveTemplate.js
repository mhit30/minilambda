async function resolveTemplate(templateStr, dagId) {
  // Match all expressions like {{stepId.output.key}}
  const regex = /\{\{(.+?)\}\}/g;

  // return in {{...}} and "..." format (elem 0 and 1 respectively)
  const matches = [...templateStr.matchAll(regex)];
  // if no matches, return as is
  if (!matches.length) return templateStr;

  // Resolve all replacements
  const resolvedPieces = await Promise.all(
    matches.map(async (match) => {
      const expr = match[1].trim(); // match[1] is "step1.output.text" match[0] is {{step1.output.text}}
      const [stepId, , field] = expr.split(".");
      // find where we saved our prev output!
      const raw = await connection.get(`dag:${dagId}:node:${stepId}:output`);
      // get that prev output and turn it into json object
      const parsed = JSON.parse(raw || "{}");
      // grab that json object's field value, i.e, .text, etc
      return parsed[field] || "";
    })
  );

  // after we have received all of those field values,
  // Build final string by replacing matches, the {{...}} with those values

  // E.g. matches = [[{{}}, ""], [{{}}, ""]] thus replace each {{...}} in tempStr with "..." in resolvedPieces,
  // indices already match as we output in order
  let result = templateStr;
  matches.forEach((match, index) => {
    result = result.replace(match[0], resolvedPieces[index]);
  });

  return result;
}

module.exports = resolveTemplate;
