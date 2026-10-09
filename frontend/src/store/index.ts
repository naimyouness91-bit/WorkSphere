import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import employeesReducer from './employeesSlice'
import notificationReducer from './notificationSlice'
import documentsReducer from './documentsSlice'
import eventsReducer from './eventsSlice'
import payrollsReducer from './payrollsSlice'
import requestsReducer from './requestsSlice'
import applicationsReducer from './applicationsSlice'
import evaluationsReducer from './evaluationsSlice'
import jobsReducer from './jobsSlice'
import skillsReducer from './skillsSlice'
import trainingsReducer from './trainingsSlice'
import projectsReducer from './projectsSlice'
import tasksReducer from './tasksSlice'
import ticketsReducer from './ticketsSlice'
import chatReducer from './chatSlice'
import attendanceReducer from './attendanceSlice'
import leavesReducer from './leavesSlice'
import expensesReducer from './expensesSlice'
import budgetsReducer from './budgetsSlice'
import auditLogsReducer from './auditLogsSlice'
import reportsReducer from './reportsSlice'
import integrationsReducer from './integrationsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeesReducer,
    documents: documentsReducer,
    events: eventsReducer,
    payrolls: payrollsReducer,
    trainings: trainingsReducer,
    skills: skillsReducer,
    evaluations: evaluationsReducer,
    jobs: jobsReducer,
    applications: applicationsReducer,
    requests: requestsReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
    tickets: ticketsReducer,
    chat: chatReducer,
    attendance: attendanceReducer,
    leaves: leavesReducer,
    expenses: expensesReducer,
    budgets: budgetsReducer,
    auditLogs: auditLogsReducer,
    reports: reportsReducer,
    integrations: integrationsReducer,
    notifications: notificationReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
