'use strict';

var $ = require('jquery');

function modalClose() {

    var directive =
        {
            link: link,
            templateUrl: function (elem, attrs) { return attrs.templateUrl; },
            restrict: 'E',
            scope:
            {
                action: '&',
                newClass: '@',
            }
        };

    return directive;

    function link(scope, element, attrs) {

        scope.onAction = function () {

            var el = $("[role='dialog']");
            var windowClass = el.attr("window-class");
            el.removeClass(windowClass);
            el.addClass(scope.newClass);
            scope.action();
        };
    }

}

function elementProperties(common) {

    var directive =
        {
            link: link,
            templateUrl: 'diagrams/ElementPropertiesPane.html',
            restrict: 'E',
            scope:
            {
                selected: '=',
                elementType: '@',
                edit: '&'
            }
        };

    return directive;

    function link(scope, element, attrs) {
    }

}

function elementThreats($routeParams, $location, common, dialogs) {

    var directive =
        {
            link: link,
            templateUrl: 'diagrams/ThreatSummaryPane.html',
            restrict: 'E',
            scope:
            {
                threats: '=',
                graph: '=',
                save: '&'
            }
        };

    var newThreat = initialiseThreat();
    var copyableThreats = [];
    var selectedThreats = initialiseSelectedThreats();
    var editIndex = null;
    var originalThreat = {};
    var getLogFn = common.logger.getLogFn;
    var logError = getLogFn('tmtElementThreats', 'error');

    return directive;

    function link(scope, element, attrs) {
        scope.applyToAll = false;

        scope.onNewThreat = function () {
            dialogs.confirm('diagrams/ThreatEditPane.html', scope.addThreat, function () { return { heading: 'New Threat', threat: newThreat, editing: true }; }, reset);
        };

        scope.onCopyThreat = function () {
            copyableThreats = initialiseCopyableThreats(scope.graph);
            dialogs.confirm('diagrams/ThreatListPane.html', scope.addCopiedThreats, function () { return { heading: 'Copy Threats', threats: copyableThreats, selected: selectedThreats }; }, resetCopy);
        };

        scope.addCopiedThreats = function () {
            if (!scope.threats) {
                scope.threats = [];
            }

            selectedThreats.threats.forEach(function(item) {
                scope.threats.push(item.threat);
                scope.save({ threat: item.threat });
            });

            resetCopy();
        };

        scope.onEditThreat = function (index) {
            editIndex = index;
            originalThreat = angular.copy(scope.threats[index]);
            $location.search('threat', originalThreat.id);
            dialogs.confirm('diagrams/ThreatEditPane.html', scope.editThreat, function () { return { heading: 'Edit Threat', threat: scope.threats[index], editing: true }; }, scope.cancelEdit);
        };

        scope.removeThreat = function (index) {
            scope.threats.splice(index, 1);
            scope.save();
        };

        scope.addThreat = function () {

            if (!scope.threats) {
                scope.threats = [];
            }

            scope.threats.push(newThreat);
            scope.save({ threat: newThreat });
            reset();
        };

        scope.editThreat = function () {
            scope.save();
            reset();
        };

        scope.cancelEdit = function () {
            scope.threats[editIndex] = originalThreat;
            reset();
        };

        var threatId = $routeParams.threat;

        if (angular.isDefined(threatId)) {
            var matchingIndex = -1;

            scope.threats.forEach(function (threat, index) {
                if (threat.id == threatId) {
                    matchingIndex = index;
                }
            });

            if (matchingIndex >= 0) {
                scope.onEditThreat(matchingIndex);
            }
            else {
                logError('Invalid threat ID');
                $location.search('threat', null);
            }
        }
    }

    function reset() {
        newThreat = initialiseThreat();
        editIndex = null;
        $location.search('threat', null);
    }

    function resetCopy() {
        selectedThreats = initialiseSelectedThreats();
    }

    function initialiseCopyableThreats(graph) {
        var list = [];
        graph.getCells().forEach(function(cell) {
            if (typeof cell.threats !== 'undefined') {
                cell.threats.forEach(function(threat) {
                    list.push({
                        type: cell.attributes.type,
                        name: cell.name,
                        threat: threat
                    });
                });
            }
        });
        return list;
    }

    function initialiseThreat() {
        return { status: 'Open', severity: 'Medium' };
    }

    function initialiseSelectedThreats() {
        return { threats: [] };
    }
}

module.exports = {
    modalClose: modalClose,
    elementProperties: elementProperties,
    elementThreats: elementThreats
};
