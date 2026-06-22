function createGymWarsSheet() {
  const ss = SpreadsheetApp.create('GymWars Database');
  const id = ss.getId();

  const tabs = {
    Users: ['id', 'email', 'name', 'created_at'],
    CheckIns: ['id', 'user_id', 'date'],
    WeeklyChallenges: ['id', 'exercise_name', 'week_start', 'status'],
    ChallengeEntries: ['id', 'challenge_id', 'user_id', 'weight', 'reps', 'sets', 'created_at'],
    WorkoutPlans: ['id', 'user_id', 'exercise_name', 'day_of_week', 'target_sets', 'target_reps'],
    WorkoutEntries: ['id', 'user_id', 'exercise_name', 'date', 'weight', 'reps', 'sets'],
  };

  Object.entries(tabs).forEach(([name, headers], i) => {
    const sheet = i === 0
      ? ss.getSheets()[0].setName(name)          // repurpose default Sheet1
      : ss.insertSheet(name);                     // add new tabs
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    const range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight('bold');
    SpreadsheetApp.flush();
  });

  Logger.log('Sheet created! ID: ' + id);
  Logger.log('URL: ' + ss.getUrl());
}
