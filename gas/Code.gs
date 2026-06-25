const SHEET_ID = '1VvlaticHK2hw79N5Sd5tZvy60srhSPv3Rc_fJf11QbU';
const SHEETS = ['Users', 'CheckIns', 'WeeklyChallenges', 'ChallengeEntries', 'WorkoutPlans', 'WorkoutEntries', 'Comments'];

function doGet(e) {
  const path = e.parameter.path || '';
  return handleRequest('GET', path, e.parameter);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  return handleRequest('POST', data.path, data);
}

function handleRequest(method, path, params) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    method = params._method || method;
    let result;
    switch (path) {
      case '/users': result = handleUsers(method, params, ss); break;
      case '/checkins': result = handleCheckIns(method, params, ss); break;
      case '/challenges': result = handleChallenges(method, params, ss); break;
      case '/challengeEntries': result = handleChallengeEntries(method, params, ss); break;
      case '/workoutPlans': result = handleWorkoutPlans(method, params, ss); break;
      case '/workoutEntries': result = handleWorkoutEntries(method, params, ss); break;
      case '/comments': result = handleComments(method, params, ss); break;
      case '/reports/streaks': result = getStreak(params, ss); break;
      case '/reports/challengeResults': result = getChallengeResults(params, ss); break;
      case '': case '/': result = { endpoints: ['/users', '/checkins', '/challenges', '/challengeEntries', '/workoutPlans', '/workoutEntries', '/reports/streaks', '/reports/challengeResults'], sheetId: SHEET_ID }; break;
      default: throw new Error('Unknown path: ' + path);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet(name, ss) {
  const sheet = ss.getSheetByName(name);
  if (sheet) return sheet;
  const headers = { Users: ['id', 'email', 'name', 'created_at'], CheckIns: ['id', 'user_id', 'date'], WeeklyChallenges: ['id', 'exercise_name', 'week_start', 'status'], ChallengeEntries: ['id', 'challenge_id', 'user_id', 'weight', 'reps', 'sets', 'created_at'], WorkoutPlans: ['id', 'user_id', 'exercise_name', 'day_of_week', 'target_sets', 'target_reps'], WorkoutEntries: ['id', 'user_id', 'exercise_name', 'date', 'weight', 'reps', 'sets'], Comments: ['id', 'user_id', 'user_name', 'message', 'created_at'] }[name];
  if (!headers) throw new Error(`Sheet "${name}" not found`);
  const created = ss.insertSheet(name);
  created.appendRow(headers);
  created.setFrozenRows(1);
  const range = created.getRange(1, 1, 1, headers.length);
  range.setFontWeight('bold');
  SpreadsheetApp.flush();
  return created;
}

function readRows(sheet) {
  const vals = sheet.getDataRange().getValues();
  if (vals.length < 2) return [];
  const headers = vals[0];
  return vals.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(sheet, data, ss) {
  const headers = sheet.getDataRange().getValues()[0] || [];
  const row = headers.map(h => data[h] !== undefined ? data[h] : '');
  sheet.appendRow(row);
  const id = sheet.getLastRow() - 1;
  return { ...data, id };
}

function updateRow(sheet, id, data, ss) {
  const headers = sheet.getDataRange().getValues()[0] || [];
  const rowNum = id + 1;
  headers.forEach((h, i) => {
    if (data[h] !== undefined) sheet.getRange(rowNum, i + 1).setValue(data[h]);
  });
  return data;
}

function deleteRow(sheet, id) {
  sheet.deleteRow(id + 1);
}

function nextId(sheet) {
  return sheet.getLastRow();
}
