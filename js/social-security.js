/**
 * Created with JetBrains WebStorm.
 * User: Domingo Polican
 * Date: 9/5/13
 * Time: 6:45 AM
 * To change this template use File | Settings | File Templates.
 */
function SocialSecurityController($scope, $rootScope, dialog, SocialSecurityRepository) {

    $scope.records = [];

    $scope.gridOptions = {
        data: 'records',
        enableCellEditOnFocus: true,
        enableCellSelection: true,
        enableRowSelection: false,
        enableSorting: false,
        columnDefs: [
            {field:'bracket', displayName:'Bracket', cellFilter: 'number', width: 68, enableCellEdit: false },
            {field:'salary', displayName:'Salary', cellFilter: 'currency'},
            {field:'credit', displayName:'Credit', cellFilter: 'currency'},
            {field:'employerSS', displayName:'Employer SS', cellFilter: 'currency'},
            {field:'employerEC', displayName:'Employer EC', cellFilter: 'currency'},
            {field:'employeeSS', displayName:'Employee SS', cellFilter: 'currency'}
        ]
    };

    SocialSecurityRepository.getAll()
        .then(function(result){
            $scope.records = result;
        }, function() { alert("Error loading Social Security records.")});

    $scope.saveSSS = function() {
        SocialSecurityRepository.saveAll($scope.records, function() {
            $rootScope.$broadcast(PayrollConstants.socialSecurityUpdatedEvent);
        });
        dialog.close();
    };

    $scope.cancelSSS = function () {
        dialog.close();
    };

    $scope.addRow = function() {
        var newrecord = SocialSecurityRepository.newRecord();
        newrecord.bracket = $scope.determineNextBracket();
       $scope.records.push(newrecord);
    };

    $scope.deleteRow = function() {
        var rows = $scope.records.length;
        if (rows > 0) {
            $scope.records.splice(rows - 1, 1);
        }
    }

    $scope.determineNextBracket = function () {
        var max = 0;

        for (var i = 0; i < $scope.records.length; i++)
        {
            if (max < $scope.records[i].bracket)
            {
                max = $scope.records[i].bracket;
            }
        }

        return 1 + max;
    };
};

function SocialSecurityRepository(DataService, $q, $rootScope) {
    var socialSecurityRecords;

    var getAll = function() {
        var delay = $q.defer();
        var errorHandler = function(error) {
            delay.reject('Error retrieving social security records Error was ' + error.message + ' (Code ' + error.code + ')');
            return false;
        };
        var successHandler = function (result) {
            var records = [];
            for (var i = 0; i < result.length; i++) {
                records.push(result[i]);
            }

            socialSecurityRecords = angular.copy(records);
            delay.resolve(records);
            $rootScope.$apply();
        };

        DataService.socialSecurityDB.getAll(successHandler, errorHandler);

        return delay.promise;
    };

    var saveAll = function(updatedRecords, successHandler) {
        var recordsToSave = updatedRecords;
        var ids = [];

        var errorOccurred = false;

        var errorHandler = function(error) {
            alert('Error saving social security records. Error was ' + error.message + ' (Code ' + error.code + ')');
            errorOccurred = true;
            return false;
        };

        for (var i = 0; i < recordsToSave.length; i++) {
            var recordToSave = recordsToSave[i];
            ids.push(recordToSave.bracket);
            DataService.socialSecurityDB.put(recordToSave, function(id) { console.log("Bracket: " + id) }, errorHandler);
        };

        angular.forEach(socialSecurityRecords, function(socialSecurityRecord, index) {
            if (ids.indexOf(socialSecurityRecord.bracket) < 0) {
                DataService.socialSecurityDB.remove(socialSecurityRecord.bracket, function() {}, errorHandler);
            }
        });

        socialSecurityRecords = angular.copy(updatedRecords);
        if (successHandler) {
            successHandler();
        }
    };

    var newRecord = function() {
        return { bracket: '', salary: 0, credit: 0, employerSS: 0, employerEC: 0, employeeSS: 0 };
    };

    return {
        getAll: getAll,
        saveAll: saveAll,
        newRecord: newRecord
    }
}

