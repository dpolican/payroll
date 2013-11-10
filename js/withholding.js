/**
 * Created by Domingo Polican on 9/30/13.
 */
function WithholdingRepository(DataService, $q, $rootScope) {
    var withholdings;

    var getAll = function() {
        var delay = $q.defer();
        var errorHandler = function(error) {
            delay.reject('Error retrieving withholding records. Error was ' + error.message + ' (Code ' + error.code + ')');
            return false;
        };
        var successHandler = function (result) {
            var records = [];
            for (var i = 0; i < result.length; i++) {
                records.push(result[i]);
            }

            withholdings = angular.copy(records);
            delay.resolve(records);
            $rootScope.$apply();
        };

        if (withholdings) {
            delay.resolve(angular.copy(withholdings));
        } else {
            DataService.withholdingDB.getAll(successHandler, errorHandler);
        }

        return delay.promise;
    };

    var saveAll = function(updatedRecords, successHandler) {
        var recordsToSave = updatedRecords;
        var ids = [];

        var errorOccurred = false;

        var errorHandler = function(error) {
            alert('Error saving withholding records. Error was ' + error.message + ' (Code ' + error.code + ')');
            errorOccurred = true;
            return false;
        };

        for (var i = 0; i < recordsToSave.length; i++) {
            var recordToSave = recordsToSave[i];
            ids.push(recordToSave.id);
            DataService.withholdingDB.put(recordToSave, function(id) { console.log("ID: " + id) }, errorHandler);
        };

        angular.forEach(withholdings, function(withholding, index) {
            if (ids.indexOf(withholding.id) < 0) {
                DataService.withholdingDB.remove(withholding.id, function() {}, errorHandler);
            }
        });

        withholdings = angular.copy(updatedRecords);
        if (successHandler) {
            successHandler();
        }
    };

    return {
        saveAll: saveAll,
        getAll: getAll
    }
};

function WithholdingController($scope, $rootScope, $filter, dialog, WithholdingRepository, WithholdingTypesRepository) {
    $scope.records = [];
    $scope.withholdingTypes = [];

    $scope.gridOptions = {
        data: 'records',
        selectWithCheckboxOnly: true,
        showSelectionCheckbox: true,
        enableCellEditOnFocus: true,
        enableCellSelection: false,
        enableRowSelection: true,
        enableSorting: false,
        selectedItems: [],
        columnDefs: [
            {field:'paySchedule', displayName:'Pay Schedule', enableCellEdit: false },
            {field:'status', displayName:'Status', width: 88, editableCellTemplate: '<select class="input-small" ng-model="COL_FIELD"><option ng-repeat="wth in withholdingTypes">{{wth.type}}</option></select>' },
            {field:'salaryLimit', displayName:'Salary Limit', cellFilter: 'currency'},
            {field:'base', displayName:'Base', cellFilter: 'currency'},
            {field:'factor', displayName:'Factor', cellFilter: 'number:2'}
        ]
    };

    WithholdingRepository.getAll()
        .then(function(result){
            result = $filter('orderBy')(result, function(record) {
                var pad = '000000000';
                var limit = parseFloat(record.salaryLimit);
                var limitString = "" + limit;
                return record.status + (pad.substring(0, pad.length - limitString.length) + limitString);
            });
            $scope.records = result;
        }, function() { alert("Error loading Withholding data.")});

    WithholdingTypesRepository.getAll()
        .then(function(result) {
            $scope.withholdingTypes = result;
        }, function() { alert("Error loading withholding types.")});

    $scope.determineNextId = function () {
        var max = 0;

        for (var i = 0; i < $scope.records.length; i++)
        {
            if (max < $scope.records[i].id)
            {
                max = $scope.records[i].id;
            }
        }

        return 1 + max;
    };

    $scope.addRow = function() {
        var newrecord = { paySchedule: 'Weekly', status: '' };
        newrecord.id = $scope.determineNextId();

        $scope.records.push(newrecord);
    };

    $scope.deleteRows = function() {
        angular.forEach($scope.gridOptions.selectedItems, function(selected) {
            var index = $scope.records.indexOf(selected);
            if (index > -1) {
                $scope.records.splice(index, 1);
            }
        });
    };

    $scope.save = function() {
        WithholdingRepository.saveAll($scope.records, function() {
            $rootScope.$broadcast(PayrollConstants.withholdingUpdatedEvent);
        });
        dialog.close();
    };

    $scope.cancel = function () {
        dialog.close();
    };

};
