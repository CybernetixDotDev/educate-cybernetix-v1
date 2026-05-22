update storage.buckets
set allowed_mime_types = array[
  'application/json',
  'application/octet-stream',
  'text/plain',
  'text/vtt',
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'audio/mpeg',
  'audio/mp4',
  'audio/aac',
  'video/mp4'
]
where id = 'lesson-renders';
