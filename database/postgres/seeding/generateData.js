/* eslint-disable no-console */

const faker = require('faker');
const fs = require('fs');
const path = require('path');
const importData = require('./importData.js');

const confirmPath = (dirPath) => {
  const directories = dirPath.split('/');
  if (directories[0].length === 0) {
    directories.shift();
  }
  const checkAndCreateDirs = (pathOfDirs) => {
    const modifiedPathOfDirs = pathOfDirs.slice();
    if (modifiedPathOfDirs.length === 1) {
      return modifiedPathOfDirs[0];
    }
    if (modifiedPathOfDirs[0].charAt(0) !== '/') {
      modifiedPathOfDirs[0] = `/${modifiedPathOfDirs[0]}`;
    } else {
      modifiedPathOfDirs[0] += `/${modifiedPathOfDirs.splice(1, 1)}`;
    }
    if (!fs.existsSync(modifiedPathOfDirs[0])) {
      fs.mkdirSync(modifiedPathOfDirs[0]);
    }
    return checkAndCreateDirs(modifiedPathOfDirs);
  };
  return checkAndCreateDirs(directories);
};

// const MODE = 'generate data only';
const MODE = 'generate data and build database';
const TARGET_PATH = confirmPath(path.join(process.env.HOME, '/Documents/Dev/_Hack Reactor/_HRSF132/Sprints/SDC/genData'));
const RATIO_MULTIPLIER = 1;
const MAX_RECORDS_PER_FILE = 100;

const tables = [
  {
    name: 'users',
    header: 'name;email;password;role;is_superhost\n',
    recordTypes: [
      'name.findName',
      'internet.email',
      'internet.password',
      'role',
      'random.boolean',
    ],
    recordCountRatio: 1,
  },
  {
    name: 'properties',
    header: 'average_rating;review_count;bed_count;house_type;nightly_price;image_name;image_description;image_url;host_id\n',
    recordTypes: [
      'average_rating',
      'review_count',
      'bed_count',
      'random.alpha',
      'nightly_price',
      'random.word',
      'random.words',
      'image_url',
      'id_users',
    ],
    recordCountRatio: 10,
  },
  {
    name: 'nearby_properties',
    header: 'origin_property_id;nearby_property_id\n',
    recordTypes: [
      'id_properties',
      'id_properties',
    ],
    recordCountRatio: 50,
  },
  // {
  //   name: 'lists',
  //   header: 'name;image_url;user_id\n',
  //   recordTypes: [
  //     'random.word',
  //     'image_url',
  //     'id_users',
  //   ],
  //   recordCountRatio: 5,
  // },
  // {
  //   name: 'properties_lists',
  //   header: 'property_id;list_id\n',
  //   recordTypes: [
  //     'id_properties',
  //     'id_lists',
  //   ],
  //   recordCountRatio: 15,
  // },
];

const appendFileAndRecordCounts = (tableList) => {
  tableList.forEach((table) => {
    table.fileCount = (table.recordCountRatio * RATIO_MULTIPLIER) / MAX_RECORDS_PER_FILE >= 1
      ? Math.ceil((table.recordCountRatio * RATIO_MULTIPLIER) / MAX_RECORDS_PER_FILE)
      : 1;
    table.recordsPerFile = Math.ceil((table.recordCountRatio * RATIO_MULTIPLIER) / table.fileCount);
  });
};

let dirName = '';

const createDir = () => {
  const fileCount = fs.readdirSync(TARGET_PATH).length;
  let takenName = fileCount > 0 && fs.readdirSync(TARGET_PATH)[fileCount - 1].match(/^(.*[^\d]\d+)$/)
    ? fs.readdirSync(TARGET_PATH)[fileCount - 1].match(/^(.*[^\d]\d+)$/)[1]
    : 'R0';
  const prevNameStem = takenName.match(/^(.+)\d+$/)[1];
  let availableNameNotFound = true;
  while (availableNameNotFound) {
    const nextNameNumber = Number(takenName.match(/^.*[^\d](\d+)$/)[1]) + 1;
    const nextNameToTry = prevNameStem + nextNameNumber;
    const nextNameWithPath = path.join(TARGET_PATH, nextNameToTry);
    if (fs.existsSync(nextNameWithPath)) {
      takenName = nextNameToTry;
    } else {
      availableNameNotFound = false;
      fs.mkdirSync(nextNameWithPath);
      dirName = nextNameToTry;
    }
  }
};

const writeCsvFile = (targetPath, directory, filename, header, callback) => {
  const filepath = path.join(targetPath, directory, filename);
  const csvFileWriter = fs.createWriteStream(filepath);
  csvFileWriter.write(header, 'utf8', callback);
  return csvFileWriter;
};

const getRandom = {
  imgUrl() {
    const imgNumber = Math.ceil(Math.random() * 1000);
    return `https://imgazou.s3-us-west-1.amazonaws.com/img1/img-${imgNumber}.jpg`;
  },
  avgRating() {
    return (Math.random() * 5).toFixed(2);
  },
  reviewCount() {
    return Math.ceil(Math.random() * 500);
  },
  bedCount() {
    return Math.ceil(Math.random() * 5);
  },
  nightlyPrice() {
    return (Math.random() * 1000).toFixed(2);
  },
  role() {
    const roles = ['free', 'guest', 'host', 'staff', 'admin', 'superadmin'];
    const index = Math.floor(Math.random() * roles.length);
    return roles[index];
  },
  id(tableName) {
    let tableIndex;
    for (let i = 0; i < tables.length; i += 1) {
      if (tables[i].name === tableName) {
        tableIndex = i;
        break;
      }
    }
    const maxId = tables[tableIndex].fileCount * tables[tableIndex].recordsPerFile;
    return Math.ceil(Math.random() * maxId);
  },
};

const status = {
  filesWritten: 0,
  tablesWritten: 0,
};

const writeRecords = (
  fileWriter,
  recordCount,
  recordTypes,
  filename,
  fileCount,
) => {
  let recordsWritten = 0;
  const writeFile = () => {
    let ableToContinue = true;
    while (recordsWritten <= recordCount && ableToContinue) {
      recordsWritten += 1;
      let record = '';
      recordTypes.forEach((type) => {
        let data;
        if (type === 'image_url') {
          data = getRandom.imgUrl();
        } else if (type === 'average_rating') {
          data = getRandom.avgRating();
        } else if (type === 'review_count') {
          data = getRandom.reviewCount();
        } else if (type === 'bed_count') {
          data = getRandom.bedCount();
        } else if (type === 'nightly_price') {
          data = getRandom.nightlyPrice();
        } else if (type === 'role') {
          data = getRandom.role();
        } else if (type.match(/^id_\w+$/)) {
          const idType = type.match(/^id_(\w+)$/)[1];
          data = getRandom.id(idType);
        } else if (type.indexOf('.') > -1) {
          const category = type.match(/^(\w+)\.\w+$/)[1];
          const subCategory = type.match(/^\w+\.(\w+)$/)[1];
          data = faker[category][subCategory]();
        } else {
          data = faker[type]();
        }
        record += `${data};`;
      });
      record = `${record.slice(0, record.length - 1)}\n`;
      if (recordsWritten % Math.ceil(MAX_RECORDS_PER_FILE / 20) === 0) {
        console.log(`${recordsWritten} records written to ${filename}`);
      }
      if (recordsWritten < recordCount) {
        ableToContinue = fileWriter.write(record, 'utf-8');
      } else if (recordsWritten === recordCount) {
        console.log(`${filename} CREATION COMPLETE`);
        fileWriter.write(record, 'utf-8', () => {
          fileWriter.end();
          handleNextAction(filename, fileCount);
        });
      }
    }
    if (recordsWritten < recordCount) {
      fileWriter.once('drain', writeFile);
    }
  };
  writeFile();
};

const createCsvFile = ({
  name,
  header,
  recordTypes,
  fileCount,
  recordsPerFile,
}) => {
  const filename = `${name}${status.filesWritten}.csv`;
  const writeSpecificCsvFile = writeCsvFile(
    TARGET_PATH,
    dirName,
    filename,
    header,
  );
  writeRecords(
    writeSpecificCsvFile,
    recordsPerFile,
    recordTypes,
    filename,
    fileCount,
  );
};

const handleNextAction = (filename, fileCount) => {
  const takeNextAction = () => {
    status.filesWritten += 1;
    if (status.filesWritten >= fileCount) {
      status.tablesWritten += 1;
      status.filesWritten = 0;
    }
    if (status.tablesWritten < tables.length) {
      createCsvFile(tables[status.tablesWritten]);
    } else {
      console.log('\nData generation process complete!\n');
      process.exit(0);
    }
  };
  if (MODE === 'generate data only') {
    takeNextAction();
  } else if (MODE === 'generate data and build database') {
    const tableName = tables[status.tablesWritten].name;
    const filePath = path.join(TARGET_PATH, dirName, filename);
    importData.handleInsertRecords(tableName, filePath, (err, res, database) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`${filename} successfully imported into ${database}: ${tableName}`);
        takeNextAction();
      }
    });
  }
};

appendFileAndRecordCounts(tables);

createDir();

if (MODE === 'generate data only') {
  createCsvFile(tables[status.tablesWritten]);
} else if (MODE === 'generate data and build database') {
  importData.restartTables((err) => {
    if (err) {
      console.error(err);
    } else {
      createCsvFile(tables[status.tablesWritten]);
    }
  });
}
