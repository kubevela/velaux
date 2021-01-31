import { Request, Response } from 'express';

const getCatalogs = (req: Request, res: Response) => {
  res.json({
    data: [
      {
        id: '000000001',
        name: 'test',
        desc: 'First catalog',
        created_at: '2021-01-20',
        updated_at: '2021-01-21',
      },
      {
        id: '000000002',
        name: 'test2',
        desc: 'Second catalog',
        created_at: '2021-01-20',
        updated_at: '2021-01-21',
      },
    ],
  });
};

export default {
  'GET /api/catalogs': getCatalogs,
};
