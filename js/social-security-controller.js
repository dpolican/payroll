/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/5/13
 * Time: 6:45 AM
 * To change this template use File | Settings | File Templates.
 */
function SocialSecurityController($scope, dialog, SocialSecurityRepository) {

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
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }, function() { alert("Error loading Social Security records.")});

    $scope.saveSSS = function() {
        SocialSecurityRepository.saveAll($scope.records);
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
}
