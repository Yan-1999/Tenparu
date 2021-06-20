var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _TaskView_instances, _TaskView_div, _TaskView_next_button, _TaskView_done_button, _TaskView_renderDiv, _TaskView_bindController, _TaskController_task, _TaskController_view;
var Stage;
(function (Stage) {
    Stage[Stage["Backlog"] = 0] = "Backlog";
    Stage[Stage["Todo"] = 1] = "Todo";
    Stage[Stage["InProgress"] = 2] = "InProgress";
    Stage[Stage["Verify"] = 3] = "Verify";
    Stage[Stage["Done"] = 4] = "Done";
})(Stage || (Stage = {}));
const STROAGE_KEY = 'tenparu';
var curStage = Stage.InProgress;
/**
 * `Date.now()`
 * @param datetime time
 * @returns str rep of time difference
 */
function diffTimeStr(datetime) {
    let diff = Date.now() - datetime.getTime();
    let suffix = 'passed';
    if (diff < 0) {
        diff = -diff;
        suffix = 'left';
    }
    if (diff > 86400000) {
        return [Math.floor(diff / 86400000).toString(),
            'days',
            suffix].join(' ');
    }
    else if (diff > 3600000) {
        return [Math.floor(diff / 3600000).toString(),
            'hours',
            suffix].join(' ');
    }
    else {
        return [Math.floor(diff / 60000).toString(),
            'minutes',
            suffix].join(' ');
    }
}
/**
 * Task Class
 */
class Task {
    constructor(name, due, description, stage) {
        this.progress = 0;
        this.max_progress = 10;
        this.name = name;
        this.due = due;
        this.description = description;
        this.stage = stage;
    }
    static get undoneCount() {
        let undoneCnt = 0;
        for (let stage = 0; stage < Stage.Done; stage++) {
            const cnt = Task.numTaskInStage[stage];
            undoneCnt += cnt;
        }
        return undoneCnt;
    }
    /**
     * Load Task.tasks form `localStorage` to `Task.tasks`.
     */
    static load() {
        Task.numTaskInStage.fill(0, Stage.Backlog, Stage.Done + 1);
        let tasksStr = window.localStorage.getItem(STROAGE_KEY);
        if (tasksStr !== null) {
            let raw_list = JSON.parse(tasksStr);
            for (const key in raw_list) {
                const raw = raw_list[key];
                raw.due = new Date(raw.due);
                let task = Task.tasks[key] = new Task();
                Object.assign(task, raw);
                Task.numTaskInStage[task.stage]++;
            }
        }
    }
    /**
     * Write `Task.tasks` to `localStorage`.
     */
    static store() {
        window.localStorage.setItem(STROAGE_KEY, JSON.stringify(Task.tasks));
    }
    setProgress(val) {
        this.progress = val;
        Task.store();
    }
    /**
     * Set `this.stage`.
     * IGNORE OUT OF RANGE ERROR.
     * @param stage stage to change to
     */
    setStage(stage) {
        Task.numTaskInStage[this.stage]--;
        Task.numTaskInStage[stage]++;
        this.stage = stage;
        this.progress = 0;
        Task.store();
    }
    static insert(task) {
        Task.tasks[task.name] = task;
        Task.numTaskInStage[task.stage]++;
        Task.store();
    }
    static erase(task) {
        Task.numTaskInStage[task.stage]--;
        delete Task.tasks[task.name];
        Task.store();
    }
    static completeTasksOfStage(stage) {
        for (const key in Task.tasks) {
            const task = Task.tasks[key];
            if (task.stage === stage) {
                task.progress = task.max_progress;
            }
        }
        Task.store();
    }
    static moveCompleteTasks(form, to) {
        let cnt = 0;
        for (const key in Task.tasks) {
            const task = Task.tasks[key];
            if (task.stage === form &&
                task.progress === task.max_progress) {
                task.stage = to;
                task.progress = 0;
                cnt++;
            }
        }
        Task.numTaskInStage[form] -= cnt;
        Task.numTaskInStage[to] += cnt;
        Task.store();
    }
    static eraseCompleteTasksOfStage(stage) {
        let cnt = 0;
        for (const key in Task.tasks) {
            const task = Task.tasks[key];
            if (task.stage === stage &&
                task.progress === task.max_progress) {
                delete Task.tasks[task.name];
                cnt++;
            }
        }
        Task.numTaskInStage[stage] -= cnt;
        Task.store();
    }
    static eraseDone() {
        for (const key in Task.tasks) {
            const task = Task.tasks[key];
            if (task.stage === Stage.Done) {
                delete Task.tasks[task.name];
            }
        }
        Task.numTaskInStage[Stage.Done] = 0;
        Task.store();
    }
}
Task.tasks = {};
Task.numTaskInStage = new Array(Stage.Done + 1);
class TaskView {
    /**
     * USE `TaskView.create()` TO CREATE A VIEW.
     */
    constructor(div) {
        _TaskView_instances.add(this);
        _TaskView_div.set(this, void 0);
        _TaskView_next_button.set(this, void 0);
        _TaskView_done_button.set(this, void 0);
        __classPrivateFieldSet(this, _TaskView_div, div, "f");
    }
    onProgressSet() {
        if (this.range.value === this.range.max) {
            __classPrivateFieldGet(this, _TaskView_div, "f").setAttribute('data-done', '');
        }
        else {
            __classPrivateFieldGet(this, _TaskView_div, "f").removeAttribute('data-done');
        }
    }
    erase() {
        __classPrivateFieldGet(this, _TaskView_div, "f").remove();
    }
    /* single view functions */
    static createView(task) {
        let div = document.importNode(TaskView.taskTemplate, true);
        let view = new TaskView(div);
        __classPrivateFieldGet(view, _TaskView_instances, "m", _TaskView_renderDiv).call(view, task);
        __classPrivateFieldGet(view, _TaskView_instances, "m", _TaskView_bindController).call(view, task);
        TaskView.taskList.appendChild(__classPrivateFieldGet(view, _TaskView_div, "f"));
        return view;
    }
    /* view list functions */
    /**
     * Load Task.tasks of stage to current page.
     * @param stage stage loading
     */
    static loadView(stage) {
        TaskView.taskList.innerHTML = '';
        for (const key in Task.tasks) {
            const task = Task.tasks[key];
            if (task.stage === stage) {
                TaskView.createView(task);
            }
        }
    }
    static setViewsCompleted() {
        let childern = this.taskList.children;
        for (let index = 0; index < childern.length; index++) {
            const div = childern[index];
            let range = div.getElementsByClassName('task-item-progress')[0];
            range.value = range.max;
            div.setAttribute('data-done', '');
        }
    }
    static eraseViews() {
        TaskView.taskList.innerHTML = '';
    }
    static eraseCompletedViews() {
        let child = this.taskList.firstElementChild;
        let lastChild = null;
        while (child) {
            lastChild = child;
            child = lastChild.nextElementSibling;
            let range = lastChild.getElementsByClassName('task-item-progress')[0];
            if (range.value === range.max) {
                lastChild.remove();
            }
        }
    }
    /* page functions */
    /**
     * Change current stage.
     * @param stage stage changing to
     */
    static changeView(stage) {
        TaskView.loadView(stage);
        for (let index = 0; index <= Stage.Done; index++) {
            let elem = document.getElementById(['stage-',
                Stage[index].toLowerCase()].join(''));
            if (index === stage) {
                elem.setAttribute('data-current', '');
            }
            else {
                elem.removeAttribute('data-current');
            }
        }
        TaskView.addTaskSubmit.value = ['Add task to', Stage[stage]].join(' ');
        if (stage === Stage.Done) {
            TaskView.completeAllButton.style.display = 'none';
            TaskView.doneCompletedButton.style.display = 'none';
            TaskView.deleteCompletedButton.style.display = 'none';
            TaskView.nextCompletedButton.innerText = 'Remove Done Tasks';
        }
        else {
            TaskView.completeAllButton.style.display = 'inline-block';
            TaskView.doneCompletedButton.style.display = 'inline-block';
            TaskView.deleteCompletedButton.style.display = 'inline-block';
            TaskView.nextCompletedButton.innerText = ['To', Stage[stage + 1]].join(' ');
        }
    }
    static initStageButtons() {
        let stages_div = document.getElementById('stages');
        for (let index = 0; index <= Stage.Done; index++) {
            const stage_str = Stage[index];
            let button = document.createElement('button');
            button.id = ['stage-', stage_str.toLowerCase()].join('');
            button.textContent = stage_str;
            button.onclick = TaskController.changeToStage.bind(null, index);
            let cntSpan = document.createElement('span');
            cntSpan.innerText = '0';
            button.appendChild(cntSpan);
            stages_div.appendChild(button);
        }
    }
    static bindManipulationButtons() {
        TaskView.completeAllButton.onclick =
            TaskController.completeTasksOfCurStage.bind(null);
        TaskView.nextCompletedButton.onclick =
            TaskController.advanceCompleted.bind(null);
        TaskView.doneCompletedButton.onclick =
            TaskController.doneCompleted.bind(null);
        TaskView.deleteCompletedButton.onclick =
            TaskController.deleteCompleted.bind(null);
    }
    static updateCnt() {
        let undoneCount = 0;
        for (let index = 0; index <= Stage.Done; index++) {
            const cnt = Task.numTaskInStage[index];
            let span = document.getElementById(['stage-',
                Stage[index].toLowerCase()].join(''))
                .getElementsByTagName('span')[0];
            if (cnt === 0) {
                span.style.display = 'none';
            }
            else {
                span.style.display = 'inherit';
                span.innerText = cnt.toString();
            }
            undoneCount += cnt;
        }
        undoneCount -= Task.numTaskInStage[Stage.Done];
        this.undoneCntDiv.innerText = undoneCount.toString();
    }
}
_TaskView_div = new WeakMap(), _TaskView_next_button = new WeakMap(), _TaskView_done_button = new WeakMap(), _TaskView_instances = new WeakSet(), _TaskView_renderDiv = function _TaskView_renderDiv(task) {
    __classPrivateFieldGet(this, _TaskView_div, "f").setAttribute('data-name', task.name);
    __classPrivateFieldGet(this, _TaskView_div, "f").getElementsByClassName('task-item-name')[0].textContent = task.name;
    __classPrivateFieldGet(this, _TaskView_div, "f").getElementsByClassName('task-item-due')[0].textContent = task.due.toLocaleString();
    __classPrivateFieldGet(this, _TaskView_div, "f").getElementsByClassName('task-item-description')[0].textContent = task.description;
    __classPrivateFieldGet(this, _TaskView_div, "f").getElementsByClassName('task-item-timeleft')[0].textContent = diffTimeStr(task.due);
    __classPrivateFieldSet(this, _TaskView_next_button, __classPrivateFieldGet(this, _TaskView_div, "f").getElementsByClassName('task-item-next')[0], "f");
    __classPrivateFieldSet(this, _TaskView_done_button, __classPrivateFieldGet(this, _TaskView_div, "f").getElementsByClassName('task-item-done')[0], "f");
    this.range = __classPrivateFieldGet(this, _TaskView_div, "f").getElementsByClassName('task-item-progress')[0];
    let stage = task.stage;
    if (stage >= Stage.Verify) {
        __classPrivateFieldGet(this, _TaskView_done_button, "f").style.display = 'none';
    }
    if (stage === Stage.Done) {
        __classPrivateFieldGet(this, _TaskView_next_button, "f").style.display = 'none';
        this.range.style.display = 'none';
        __classPrivateFieldGet(this, _TaskView_div, "f").setAttribute('data-done', '');
    }
    else {
        __classPrivateFieldGet(this, _TaskView_next_button, "f").textContent = Stage[stage + 1];
        this.range.value = task.progress.toString();
        this.range.max = task.max_progress.toString();
        if (this.range.value === this.range.max) {
            __classPrivateFieldGet(this, _TaskView_div, "f").setAttribute('data-done', '');
        }
    }
}, _TaskView_bindController = function _TaskView_bindController(task) {
    let controller = new TaskController(task, this);
    __classPrivateFieldGet(this, _TaskView_div, "f").getElementsByClassName('task-item-delete')[0].onclick = controller.erase.bind(controller);
    __classPrivateFieldGet(this, _TaskView_done_button, "f").onclick = controller.editStage.bind(controller, Stage.Done);
    if (task.stage !== Stage.Done) {
        __classPrivateFieldGet(this, _TaskView_next_button, "f").onclick = controller.advanceStage.bind(controller);
        this.range.onchange = controller.editProgress.bind(controller);
    }
};
TaskView.taskTemplate = document.getElementById('task-template').content.querySelector('.task');
TaskView.taskList = document.getElementById('task-list');
TaskView.addTaskSubmit = document.getElementById('add-task');
TaskView.completeAllButton = document.getElementById('complete-all');
TaskView.nextCompletedButton = document.getElementById('next-completed');
TaskView.doneCompletedButton = document.getElementById('done-completed');
TaskView.deleteCompletedButton = document.getElementById('delete-completed');
TaskView.undoneCntDiv = document.getElementById('undone');
class TaskController {
    constructor(task, view) {
        _TaskController_task.set(this, void 0);
        _TaskController_view.set(this, void 0);
        __classPrivateFieldSet(this, _TaskController_task, task, "f");
        __classPrivateFieldSet(this, _TaskController_view, view, "f");
    }
    erase() {
        __classPrivateFieldGet(this, _TaskController_view, "f").erase();
        Task.erase(__classPrivateFieldGet(this, _TaskController_task, "f"));
        TaskView.updateCnt();
    }
    editProgress() {
        let val = Number.parseInt(__classPrivateFieldGet(this, _TaskController_view, "f").range.value);
        __classPrivateFieldGet(this, _TaskController_view, "f").onProgressSet();
        __classPrivateFieldGet(this, _TaskController_task, "f").setProgress(val);
    }
    editStage(stage) {
        __classPrivateFieldGet(this, _TaskController_view, "f").erase();
        __classPrivateFieldGet(this, _TaskController_task, "f").setStage(stage);
        TaskView.updateCnt();
    }
    /**
     * Equivalent to `editStage(this.#task.stage + 1)`.
     */
    advanceStage() {
        this.editStage(__classPrivateFieldGet(this, _TaskController_task, "f").stage + 1);
    }
    /**
     * Add task to `Task.tasks` and write back.
     * @param ev event which target is a form
     * @returns false
     */
    static addTask(ev) {
        let form = ev.target;
        let data = new FormData(form);
        let name = data.get('task-name').toString();
        if (name in Task.tasks) {
            alert("Task with the name already exits!");
            return false;
        }
        let newTask = new Task(name, new Date([
            data.get('due-date').toString(),
            data.get('due-time').toString(),
        ].join(' ')), data.get('description').toString(), curStage);
        Task.insert(newTask);
        TaskView.createView(newTask);
        TaskView.updateCnt();
        return false;
    }
    static changeToStage(stage) {
        TaskView.changeView(stage);
        curStage = stage;
    }
    static completeTasksOfCurStage() {
        Task.completeTasksOfStage(curStage);
        TaskView.setViewsCompleted();
    }
    static advanceCompleted() {
        if (curStage === Stage.Done) {
            Task.eraseDone();
            TaskView.eraseViews();
        }
        else {
            Task.moveCompleteTasks(curStage, curStage + 1);
            TaskView.eraseCompletedViews();
        }
        TaskView.updateCnt();
    }
    static doneCompleted() {
        Task.moveCompleteTasks(curStage, Stage.Done);
        TaskView.eraseCompletedViews();
        TaskView.updateCnt();
    }
    static deleteCompleted() {
        Task.eraseCompleteTasksOfStage(curStage);
        TaskView.eraseCompletedViews();
        TaskView.updateCnt();
    }
}
_TaskController_task = new WeakMap(), _TaskController_view = new WeakMap();
/* manipulation */
/* main */
document.getElementById('new-task').onsubmit = TaskController.addTask;
TaskView.initStageButtons();
TaskView.bindManipulationButtons();
Task.load();
TaskView.changeView(curStage);
TaskView.updateCnt();
