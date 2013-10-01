/**
 * Created by ewkoenw on 9/30/13.
 */
function WithholdingRepository(DataService, $q, $rootScope) {
    var withholdings = [];

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

        DataService.withholdingDB.getAll(successHandler, errorHandler);

        return delay.promise;
    };

    var saveAll = function(updatedRecords) {
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
                DataService.medicareDB.remove(withholding.id, function() {}, errorHandler);
            }
        });

        withholdings = angular.copy(updatedRecords);
    };

    return {
        saveAll: saveAll,
        getAll: getAll
    }
};

function WithholdingController($scope, dialog, WithholdingRepository) {
    $scope.records = [];

    $scope.gridOptions = {
        data: 'records',
        enableCellEditOnFocus: true,
        enableCellSelection: true,
        enableRowSelection: false,
        enableSorting: false,
        columnDefs: [
            {field:'pay-schedule', displayName:'Pay Schedule' },
            {field:'status', displayName:'Status' },
            {field:'salary-limit', displayName:'Salary Limit', cellFilter: 'currency'},
            {field:'base', displayName:'Base', cellFilter: 'currency'},
            {field:'factor', displayName:'Factor', cellFilter: 'number'}
        ]
    };

    MedicareRepository.getAll()
        .then(function(result){
            $scope.records = result;
        }, function() { alert("Error loading Medicare data.")});

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
        var newrecord = {};
        newrecord.id = $scope.determineNextId();

        $scope.records.push(newrecord);
    };

    $scope.deleteRow = function() {
        var rows = $scope.records.length;
        if (rows > 0) {
            $scope.records.splice(rows - 1, 1);
        }
    };

    $scope.save = function() {
        MedicareRepository.saveAll($scope.records);
        dialog.close();
    };

    $scope.cancel = function () {
        dialog.close();
    };

};
