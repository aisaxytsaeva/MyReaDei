import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://127.0.0.1:8000/books/catalog', () => {
    return HttpResponse.json([
      { id: 1, title: 'Test Book', author: 'Test Author' }
    ]);
  }),
  
  http.post('http://127.0.0.1:8000/books/', async ({ request }) => {
    const formData = await request.formData();
    return HttpResponse.json(
      { id: 999, title: formData.get('title') },
      { status: 201 }
    );
  }),
  
  http.post('http://127.0.0.1:8000/auth/login', async ({ request }) => {
    const formData = await request.formData();
    if (formData.get('username') === 'testuser' && formData.get('password') === 'test123') {
      return HttpResponse.json({ access_token: 'fake-token' });
    }
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }),
];