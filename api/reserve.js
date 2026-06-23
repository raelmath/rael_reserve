module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: '허용되지 않는 요청입니다.' });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Slack Webhook 설정이 없습니다.' });
  }

  const booking = req.body || {};
  const requiredFields = ['date', 'time', 'studentName', 'school', 'grade', 'phone'];
  const missingField = requiredFields.find(field => !String(booking[field] || '').trim());

  if (missingField) {
    return res.status(400).json({ error: '필수 예약 정보가 누락되었습니다.' });
  }

  const message = [
    '🔔 *[라엘수학 성북관] 방문 상담 예약 접수!*',
    '',
    `• *희망일시:* ${booking.date} ${booking.time}`,
    `• *학생이름:* ${booking.studentName}`,
    `• *학교학년:* ${booking.school} (${booking.grade})`,
    `• *연락처:* ${booking.phone}`,
    `• *메모:* ${booking.memo || '없음'}`,
    '',
    '📱 조율 후 학부모님께 연락주세요.'
  ].join('\n');

  try {
    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });

    const responseText = await slackResponse.text();

    if (!slackResponse.ok || responseText !== 'ok') {
      console.error('Slack webhook failed:', slackResponse.status, responseText);
      return res.status(502).json({ error: 'Slack 알림 전송에 실패했습니다.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Slack webhook error:', error);
    return res.status(502).json({ error: 'Slack 알림 전송 중 오류가 발생했습니다.' });
  }
};
