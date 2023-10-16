import {
  ActFn,
  array,
  boolean,
  lesan,
  MongoClient,
  number,
  object,
  ObjectId,
  optional,
  size,
  string,
} from "../../mod.ts";

const coreApp = lesan();

const client = await new MongoClient("mongodb://127.0.0.1:27017/").connect();

const db = client.db("sample");

coreApp.odm.setDb(db);

// ================== MODEL SECTION ==================
// ------------------ Country Model ------------------
const countryPure = {
  name: string(),
  population: number(),
  abb: string(),
};
const countryRelations = {};
const countries = coreApp.odm.newModel(
  "country",
  countryPure,
  countryRelations,
);

// ------------------ Province Model ------------------
const provincePure = {
  name: string(),
  population: number(),
  abb: string(),
};

const provinces = coreApp.odm.newModel(
  "province",
  provincePure,
  {
    country: {
      schemaName: "country",
      type: "single",
      optional: false,
      relatedRelations: {
        provincesAsc: {
          type: "multiple",
          limit: 5,
          sort: {
            field: "_id",
            order: "asc",
          },
        },
        provincesDesc: {
          type: "multiple",
          limit: 5,
          sort: {
            field: "_id",
            order: "desc",
          },
        },
        provincesByPopAsc: {
          type: "multiple",
          limit: 5,
          sort: {
            field: "population",
            order: "asc",
          },
        },
        proviceByPopDesc: {
          type: "multiple",
          limit: 5,
          sort: {
            field: "population",
            order: "desc",
          },
        },
        capitalProvince: {
          type: "single",
        },
      },
    },
  },
);
// ------------------ User Model ------------------
const userPure = {
  name: string(),
  age: number(),
};

const users = coreApp.odm.newModel("user", userPure, {
  livedProvinces: {
    optional: false,
    schemaName: "province",
    type: "multiple",
    sort: {
      field: "_id",
      order: "desc",
    },
    relatedRelations: {
      users: {
        type: "multiple",
        limit: 5,
        sort: {
          field: "_id",
          order: "desc",
        },
      },
    },
  },

  country: {
    optional: false,
    schemaName: "country",
    type: "single",
    relatedRelations: {
      users: {
        type: "multiple",
        limit: 5,
        sort: {
          field: "_id",
          order: "desc",
        },
      },
    },
  },
});

// ================== FUNCTIONS SECTION ==================
// ------------------ Country Founctions ------------------
// ------------------ Add Country ------------------
const addCountryValidator = () => {
  return object({
    set: object(countryPure),
    get: coreApp.schemas.selectStruct("country", { users: 1 }),
  });
};

const addCountry: ActFn = async (body) => {
  const { name, population, abb } = body.details.set;
  return await countries.insertOne({
    doc: {
      name,
      population,
      abb,
    },
    projection: body.details.get,
  });
};

coreApp.acts.setAct({
  schema: "country",
  actName: "addCountry",
  validator: addCountryValidator(),
  fn: addCountry,
});

// ------------------ Add Multiple Countries ------------------
const addMultipleCountriesValidator = () => {
  return object({
    set: (object({ multiCountries: array(object()) })),
    get: coreApp.schemas.selectStruct("country", { users: 1 }),
  });
};

const addCountries: ActFn = async (body) => {
  const { multiCountries } = body.details.set;
  return await countries.insertMany({
    docs: multiCountries,
    projection: body.details.get,
  });
};

coreApp.acts.setAct({
  schema: "country",
  actName: "addCountries",
  validator: addMultipleCountriesValidator(),
  fn: addCountries,
});

// ------------------ Get Countries  ------------------
const getCountriesValidator = () => {
  return object({
    set: object({
      page: number(),
      limit: number(),
    }),
    get: coreApp.schemas.selectStruct("country", 1),
  });
};

const getCountries: ActFn = async (body) => {
  let {
    set: { page, limit },
    get,
  } = body.details;
  page = page || 1;
  limit = limit || 50;
  const skip = limit * (page - 1);
  return await countries
    .find({ projection: get, filters: {} })
    .skip(skip)
    .limit(limit)
    .toArray();
};

coreApp.acts.setAct({
  schema: "country",
  actName: "getCountries",
  validator: getCountriesValidator(),
  fn: getCountries,
});

// ------------------ Delete Country ------------------
const deleteCountryValidator = () => {
  return object({
    set: object({
      _id: string(),
    }),
    get: coreApp.schemas.selectStruct("country", 1),
  });
};

const deleteCountry: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;
  return await countries
    .deleteOne({ filter: { _id: new ObjectId(_id) }, hardCascade: true });
};

coreApp.acts.setAct({
  schema: "country",
  actName: "deleteCountry",
  validator: deleteCountryValidator(),
  fn: deleteCountry,
});

// ------------------ Province Founctions ------------------
// ------------------ Add Province ------------------
const addProvinceValidator = () => {
  return object({
    set: object({
      ...provincePure,
      isCapital: optional(boolean()),
      country: string(),
    }),
    get: coreApp.schemas.selectStruct("province", 1),
  });
};

const addProvince: ActFn = async (body) => {
  const { country, isCapital, name, population, abb } = body.details.set;

  return await provinces.insertOne({
    doc: { name, population, abb },
    projection: body.details.get,
    relations: {
      country: {
        _ids: new ObjectId(country),
        relatedRelations: {
          provincesAsc: true,
          provincesDesc: true,
          provincesByPopAsc: true,
          proviceByPopDesc: true,
          capitalProvince: isCapital,
        },
      },
    },
  });
};

coreApp.acts.setAct({
  schema: "province",
  actName: "addProvince",
  validator: addProvinceValidator(),
  fn: addProvince,
});

// ------------------ Add Multiple Provinces ------------------
const addProvincesValidator = () => {
  return object({
    set: object({
      multiProvinces: array(object()),
      country: string(),
    }),
    get: coreApp.schemas.selectStruct("province", 1),
  });
};

const addProvinces: ActFn = async (body) => {
  const { country, multiProvinces } = body.details.set;

  return await provinces.insertMany({
    docs: multiProvinces,
    projection: body.details.get,
    relations: {
      country: {
        _ids: new ObjectId(country),
        relatedRelations: {
          provincesAsc: true,
          provincesDesc: true,
          provincesByPopAsc: true,
          proviceByPopDesc: true,
          capitalProvince: false,
        },
      },
    },
  });
};

coreApp.acts.setAct({
  schema: "province",
  actName: "addProvinces",
  validator: addProvincesValidator(),
  fn: addProvinces,
});

// ------------------ Get Province ------------------
const getProvincesValidator = () => {
  return object({
    set: object({
      page: number(),
      take: number(),
      countryId: optional(size(string(), 24)),
    }),
    get: coreApp.schemas.selectStruct("province", 5),
  });
};
const getProvinces: ActFn = async (body) => {
  const {
    set: { page, take, countryId },
    get,
  } = body.details;
  const pipeline = [];

  pipeline.push({ $skip: (page - 1) * take });
  pipeline.push({ $limit: take });
  countryId &&
    pipeline.push({ $match: { "country._id": new ObjectId(countryId) } });

  return await provinces
    .aggregation({
      pipeline,
      projection: get,
    })
    .toArray();
};

coreApp.acts.setAct({
  schema: "province",
  actName: "getProvinces",
  validator: getProvincesValidator(),
  fn: getProvinces,
});

// ------------------ User Founctions ------------------
// --------------------- Add User ----------------------
const addUserValidator = () => {
  return object({
    set: object({
      ...userPure,
      country: string(),
      livedProvinces: array(string()),
    }),
    get: coreApp.schemas.selectStruct("user", 1),
  });
};
const addUser: ActFn = async (body) => {
  const { country, livedProvinces, name, age } = body.details.set;
  const obIdLivedProvinces = livedProvinces.map(
    (lp: string) => new ObjectId(lp),
  );

  return await users.insertOne({
    doc: { name, age },
    projection: body.details.get,
    relations: {
      country: {
        _ids: new ObjectId(country),
        relatedRelations: {
          users: true,
        },
      },
      livedProvinces: {
        _ids: obIdLivedProvinces,
        relatedRelations: {
          users: true,
        },
      },
    },
  });
};
coreApp.acts.setAct({
  schema: "user",
  actName: "addUser",
  validator: addUserValidator(),
  fn: addUser,
});

// --------------------- Add User Relation ----------------------
const addUserLivedProvinceValidator = () => {
  return object({
    set: object({
      _id: string(),
      livedProvinces: array(string()),
    }),
    get: coreApp.schemas.selectStruct("user", 1),
  });
};
const addUserLiveProvince: ActFn = async (body) => {
  const { livedProvinces, _id } = body.details.set;
  const obIdLivedProvinces = livedProvinces.map(
    (lp: string) => new ObjectId(lp),
  );

  return await users.addRelation({
    _id: new ObjectId(_id),
    projection: body.details.get,
    relations: {
      livedProvinces: {
        _ids: obIdLivedProvinces,
        relatedRelations: {
          users: true,
        },
      },
    },
  });
};
coreApp.acts.setAct({
  schema: "user",
  actName: "addUserLivedProvinces",
  validator: addUserLivedProvinceValidator(),
  fn: addUserLiveProvince,
});
// --------------------- Add User Relation ----------------------
const addUserCountryValidator = () => {
  return object({
    set: object({
      _id: string(),
      country: string(),
    }),
    get: coreApp.schemas.selectStruct("user", 1),
  });
};
const addUserCountry: ActFn = async (body) => {
  const { country, _id } = body.details.set;

  return await users.addRelation({
    _id: new ObjectId(_id),
    projection: body.details.get,
    relations: {
      country: {
        _ids: new ObjectId(country),
        relatedRelations: {
          users: true,
        },
      },
    },
    replace: true,
  });
};
coreApp.acts.setAct({
  schema: "user",
  actName: "addUserCountry",
  validator: addUserCountryValidator(),
  fn: addUserCountry,
});
// ================== RUNNING SECTION ==================
// --------------------- Run Server ----------------------
coreApp.runServer({ port: 8080, typeGeneration: false, playground: true });