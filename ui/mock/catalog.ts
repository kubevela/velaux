import { Request, Response } from 'express';

const getCatalogs = (req: Request, res: Response) => {
  res.json({
    catalogs: [
      {
        id: 'f430df0d-c76e-400e-ba62-db1098da71b9',
        name: 'test',
        desc: 'First catalog',
        updatedAt: '1612121016',
        url: 'https://github.com/hongchaodeng/catalog-example.git',
        rootdir: 'catalog',
        labels: {
          type: 'helm',
        },
      },
      {
        id: 'd63b41e3-398e-48d5-9b07-e26a519d1075',
        name: 'test-2',
        desc: 'Second catalog',
        updatedAt: '1612121016',
        url: 'https://github.com/hongchaodeng/catalog-example.git',
        rootdir: 'catalog',
        // labels: {
        //   type: 'helm',
        // },
      },
    ],
  });
};

export default {
  'GET /api/catalogs': getCatalogs,
};
