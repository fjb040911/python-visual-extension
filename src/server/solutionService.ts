import { collections, getCollection } from '../libs/db';
import { errorCode } from '../errorCode';

const DB_NAME = collections.VISUALCLI

export const insertSolution = (solutionObj: API.Isolution) => {
    const mc = getCollection(DB_NAME);
    const result = mc?.insert(solutionObj);
    return result;
}

export const querySolutions = (query: any = {}) => {
    const mc = getCollection(DB_NAME);
    return mc?.find(query);
}

export const queryOneSolution = (query: any = {}) => {
    const mc = getCollection(DB_NAME);
    return mc?.findOne(query);
};

export const updateSolution = (solutionObj: API.Isolution) => {
    const mc = getCollection(DB_NAME);
    let updateResult;
    console.log('updateSolution:', solutionObj);
    if (solutionObj._id) {
        const solution = mc?.findOne({ _id: solutionObj._id });
        if (solution) {
            console.log('updateMonitor solution:', solution)
            solution.name = solutionObj.name;
            solution.eformData = solutionObj.eformData
            solution.executionList = solutionObj.executionList;
            solution.formOptionsSetting = solutionObj.formOptionsSetting
            updateResult = mc?.update(solution);
        } else {
            updateResult ={ code: errorCode.update_fail_no_found }
        }
    }
    return updateResult;
};

export const removeOneSolution = (solutionObj: API.Isolution) => {
    const mc = getCollection(DB_NAME);
    return mc?.remove(solutionObj);
};
