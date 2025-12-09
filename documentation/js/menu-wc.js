'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">tesis-forntend documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AcceptComponent.html" data-type="entity-link" >AcceptComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AnalyticComponent.html" data-type="entity-link" >AnalyticComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AppComponent.html" data-type="entity-link" >AppComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AuthComponent.html" data-type="entity-link" >AuthComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/AvatarComponent.html" data-type="entity-link" >AvatarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ButtonComponent.html" data-type="entity-link" >ButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CareerComponent.html" data-type="entity-link" >CareerComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CategoryComponent.html" data-type="entity-link" >CategoryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CertificateComponent.html" data-type="entity-link" >CertificateComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CertificationComponent.html" data-type="entity-link" >CertificationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ChapDetailComponent.html" data-type="entity-link" >ChapDetailComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ChapterComponent.html" data-type="entity-link" >ChapterComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CheckboxComponent.html" data-type="entity-link" >CheckboxComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CommentComponent.html" data-type="entity-link" >CommentComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ContentComponent.html" data-type="entity-link" >ContentComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ContentLearningComponent.html" data-type="entity-link" >ContentLearningComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CourseComponent.html" data-type="entity-link" >CourseComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/CoursesComponent.html" data-type="entity-link" >CoursesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DetailComponent.html" data-type="entity-link" >DetailComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DetailsComponent.html" data-type="entity-link" >DetailsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/DialogComponent.html" data-type="entity-link" >DialogComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EducationComponent.html" data-type="entity-link" >EducationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EduLevelComponent.html" data-type="entity-link" >EduLevelComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/EduUnitComponent.html" data-type="entity-link" >EduUnitComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ExploreComponent.html" data-type="entity-link" >ExploreComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FileUploadComponent.html" data-type="entity-link" >FileUploadComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HistoryComponent.html" data-type="entity-link" >HistoryComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/HomeComponent.html" data-type="entity-link" >HomeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/IconComponent.html" data-type="entity-link" >IconComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InformationComponent.html" data-type="entity-link" >InformationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InputLabelComponent.html" data-type="entity-link" >InputLabelComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InterestComponent.html" data-type="entity-link" >InterestComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/InvitationComponent.html" data-type="entity-link" >InvitationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LandingComponent.html" data-type="entity-link" >LandingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LearningComponent.html" data-type="entity-link" >LearningComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/LoadingBarComponent.html" data-type="entity-link" >LoadingBarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ModuleComponent.html" data-type="entity-link" >ModuleComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotFoundComponent.html" data-type="entity-link" >NotFoundComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/NotificationComponent.html" data-type="entity-link" >NotificationComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PanelComponent.html" data-type="entity-link" >PanelComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PathComponent.html" data-type="entity-link" >PathComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PersonalizeComponent.html" data-type="entity-link" >PersonalizeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PopoverComponent.html" data-type="entity-link" >PopoverComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PortfolioComponent.html" data-type="entity-link" >PortfolioComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/PreviewComponent.html" data-type="entity-link" >PreviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ProfileComponent.html" data-type="entity-link" >ProfileComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/QuestionComponent.html" data-type="entity-link" >QuestionComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/RatingComponent.html" data-type="entity-link" >RatingComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ResultComponent.html" data-type="entity-link" >ResultComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SearchComponent.html" data-type="entity-link" >SearchComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SedeComponent.html" data-type="entity-link" >SedeComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SelectButtonComponent.html" data-type="entity-link" >SelectButtonComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SelectComponent.html" data-type="entity-link" >SelectComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SelectDataviewComponent.html" data-type="entity-link" >SelectDataviewComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SidebarComponent.html" data-type="entity-link" >SidebarComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StepperEduComponent.html" data-type="entity-link" >StepperEduComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StepperInfoComponent.html" data-type="entity-link" >StepperInfoComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StepperInteComponent.html" data-type="entity-link" >StepperInteComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/StudioComponent.html" data-type="entity-link" >StudioComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TestComponent.html" data-type="entity-link" >TestComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/TextComponent.html" data-type="entity-link" >TextComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ToastComponent.html" data-type="entity-link" >ToastComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/ToggleWitchComponent.html" data-type="entity-link" >ToggleWitchComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UserCoursesComponent.html" data-type="entity-link" >UserCoursesComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/UsersComponent.html" data-type="entity-link" >UsersComponent</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#directives-links"' :
                                'data-bs-target="#xs-directives-links"' }>
                                <span class="icon ion-md-code-working"></span>
                                <span>Directives</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="directives-links"' : 'id="xs-directives-links"' }>
                                <li class="link">
                                    <a href="directives/AutosizeDirective.html" data-type="entity-link" >AutosizeDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiAvatarDirective.html" data-type="entity-link" >UiAvatarDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiButtonDirective.html" data-type="entity-link" >UiButtonDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiCheckboxDirective.html" data-type="entity-link" >UiCheckboxDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiDialogDirective.html" data-type="entity-link" >UiDialogDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiFileUploadDirective.html" data-type="entity-link" >UiFileUploadDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiIconDirective.html" data-type="entity-link" >UiIconDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiInputLabelDirective.html" data-type="entity-link" >UiInputLabelDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiLoadingBarDirective.html" data-type="entity-link" >UiLoadingBarDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiPopoverDirective.html" data-type="entity-link" >UiPopoverDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiPreviewDirective.html" data-type="entity-link" >UiPreviewDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiSelectBottonDirective.html" data-type="entity-link" >UiSelectBottonDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiSelectDataviewDirective.html" data-type="entity-link" >UiSelectDataviewDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiSelectDirective.html" data-type="entity-link" >UiSelectDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiSidebarDirective.html" data-type="entity-link" >UiSidebarDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiTabsDirective.html" data-type="entity-link" >UiTabsDirective</a>
                                </li>
                                <li class="link">
                                    <a href="directives/UiToogleWitchDirective.html" data-type="entity-link" >UiToogleWitchDirective</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AuthService.html" data-type="entity-link" >AuthService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CareerService.html" data-type="entity-link" >CareerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CategoryService.html" data-type="entity-link" >CategoryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CertificateService.html" data-type="entity-link" >CertificateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ChapterService.html" data-type="entity-link" >ChapterService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CodeCountryService.html" data-type="entity-link" >CodeCountryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseBridge.html" data-type="entity-link" >CourseBridge</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CourseService.html" data-type="entity-link" >CourseService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DashboardService.html" data-type="entity-link" >DashboardService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/DifficultyService.html" data-type="entity-link" >DifficultyService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EducationService.html" data-type="entity-link" >EducationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EduLevelService.html" data-type="entity-link" >EduLevelService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EduUnitService.html" data-type="entity-link" >EduUnitService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FeedbackService.html" data-type="entity-link" >FeedbackService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/HistoryService.html" data-type="entity-link" >HistoryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/InformationService.html" data-type="entity-link" >InformationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/InterestService.html" data-type="entity-link" >InterestService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/InvitationService.html" data-type="entity-link" >InvitationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LocationService.html" data-type="entity-link" >LocationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ModuleService.html" data-type="entity-link" >ModuleService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationBridgeService.html" data-type="entity-link" >NotificationBridgeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/NotificationService.html" data-type="entity-link" >NotificationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PortfolioBridgeService.html" data-type="entity-link" >PortfolioBridgeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PortfolioService.html" data-type="entity-link" >PortfolioService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProfileBridgeService.html" data-type="entity-link" >ProfileBridgeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ProvincesService.html" data-type="entity-link" >ProvincesService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RoleService.html" data-type="entity-link" >RoleService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SedeService.html" data-type="entity-link" >SedeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StartService.html" data-type="entity-link" >StartService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StudioBridgeService.html" data-type="entity-link" >StudioBridgeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StudioService.html" data-type="entity-link" >StudioService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ThemeService.html" data-type="entity-link" >ThemeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TypeService.html" data-type="entity-link" >TypeService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UiToastService.html" data-type="entity-link" >UiToastService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService-1.html" data-type="entity-link" >UserService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WatchingService.html" data-type="entity-link" >WatchingService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AcademicInformation.html" data-type="entity-link" >AcademicInformation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AcceptInvitationCourse.html" data-type="entity-link" >AcceptInvitationCourse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AcceptInvitationSuccessResponse.html" data-type="entity-link" >AcceptInvitationSuccessResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AcceptInvitationUserNotFoundResponse.html" data-type="entity-link" >AcceptInvitationUserNotFoundResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AnalyticsCourseInfo.html" data-type="entity-link" >AnalyticsCourseInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AnalyticsFilters.html" data-type="entity-link" >AnalyticsFilters</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Answer.html" data-type="entity-link" >Answer</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AnswerUpdateItem.html" data-type="entity-link" >AnswerUpdateItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiMessageResponse.html" data-type="entity-link" >ApiMessageResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiMessageResponse-1.html" data-type="entity-link" >ApiMessageResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiNotification.html" data-type="entity-link" >ApiNotification</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse-1.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse-2.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse-3.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthResponse.html" data-type="entity-link" >AuthResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AutosaveRequestDto.html" data-type="entity-link" >AutosaveRequestDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AutosaveResponse.html" data-type="entity-link" >AutosaveResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BasicUser.html" data-type="entity-link" >BasicUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Canton.html" data-type="entity-link" >Canton</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Career.html" data-type="entity-link" >Career</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Career-1.html" data-type="entity-link" >Career</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Career-2.html" data-type="entity-link" >Career</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Career-3.html" data-type="entity-link" >Career</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Career-4.html" data-type="entity-link" >Career</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Career-5.html" data-type="entity-link" >Career</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Career-6.html" data-type="entity-link" >Career</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CareerAdmin.html" data-type="entity-link" >CareerAdmin</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CareerAdminListResponse.html" data-type="entity-link" >CareerAdminListResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CareerAdminQuery.html" data-type="entity-link" >CareerAdminQuery</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CareerInfo.html" data-type="entity-link" >CareerInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CareerPayload.html" data-type="entity-link" >CareerPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CareerPivot.html" data-type="entity-link" >CareerPivot</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Category.html" data-type="entity-link" >Category</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Category-1.html" data-type="entity-link" >Category</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Category-2.html" data-type="entity-link" >Category</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Category-3.html" data-type="entity-link" >Category</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CategoryAdmin.html" data-type="entity-link" >CategoryAdmin</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CategoryAdminListResponse.html" data-type="entity-link" >CategoryAdminListResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CategoryAdminQuery.html" data-type="entity-link" >CategoryAdminQuery</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CategoryCreateDto.html" data-type="entity-link" >CategoryCreateDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CategoryInterestMetric.html" data-type="entity-link" >CategoryInterestMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CategoryPivot.html" data-type="entity-link" >CategoryPivot</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CategoryUpdateDto.html" data-type="entity-link" >CategoryUpdateDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CertificateCourse.html" data-type="entity-link" >CertificateCourse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CertificateIndexResponse.html" data-type="entity-link" >CertificateIndexResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CertificateInfo.html" data-type="entity-link" >CertificateInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CertificateInfo-1.html" data-type="entity-link" >CertificateInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CertificateShowResponse.html" data-type="entity-link" >CertificateShowResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CertificateUser.html" data-type="entity-link" >CertificateUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CertificateView.html" data-type="entity-link" >CertificateView</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CertificationMetric.html" data-type="entity-link" >CertificationMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChangeRolesResponse.html" data-type="entity-link" >ChangeRolesResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChangeUserRoleRequest.html" data-type="entity-link" >ChangeUserRoleRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChangeUserRoleResponse.html" data-type="entity-link" >ChangeUserRoleResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Chapter.html" data-type="entity-link" >Chapter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Chapter-1.html" data-type="entity-link" >Chapter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Chapter-2.html" data-type="entity-link" >Chapter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChapterResponse.html" data-type="entity-link" >ChapterResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Chapters.html" data-type="entity-link" >Chapters</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChapterUpdateRequest.html" data-type="entity-link" >ChapterUpdateRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ChapterUpsert.html" data-type="entity-link" >ChapterUpsert</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CodeResponse.html" data-type="entity-link" >CodeResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Collaborator.html" data-type="entity-link" >Collaborator</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollaboratorInvitation.html" data-type="entity-link" >CollaboratorInvitation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollaboratorInvitationSlot.html" data-type="entity-link" >CollaboratorInvitationSlot</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollaboratorShowResponse.html" data-type="entity-link" >CollaboratorShowResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollaboratorUserSlot.html" data-type="entity-link" >CollaboratorUserSlot</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CommentResponse.html" data-type="entity-link" >CommentResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CompletedChapter.html" data-type="entity-link" >CompletedChapter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CompletedTestData.html" data-type="entity-link" >CompletedTestData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CompletedTestResponse.html" data-type="entity-link" >CompletedTestResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContendRequest.html" data-type="entity-link" >ContendRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContendResponse.html" data-type="entity-link" >ContendResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentCompletionMetric.html" data-type="entity-link" >ContentCompletionMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentResponse.html" data-type="entity-link" >ContentResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContentView.html" data-type="entity-link" >ContentView</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CountryCode.html" data-type="entity-link" >CountryCode</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Course.html" data-type="entity-link" >Course</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Course-1.html" data-type="entity-link" >Course</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Course-2.html" data-type="entity-link" >Course</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Course-3.html" data-type="entity-link" >Course</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Course-4.html" data-type="entity-link" >Course</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Course-5.html" data-type="entity-link" >Course</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseDetail.html" data-type="entity-link" >CourseDetail</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseDetailRequest.html" data-type="entity-link" >CourseDetailRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseDetailResponse.html" data-type="entity-link" >CourseDetailResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseFilters.html" data-type="entity-link" >CourseFilters</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseInvitation.html" data-type="entity-link" >CourseInvitation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CoursePopularityMetric.html" data-type="entity-link" >CoursePopularityMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseQueryParams.html" data-type="entity-link" >CourseQueryParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseRatingsMetric.html" data-type="entity-link" >CourseRatingsMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseRatingSummary.html" data-type="entity-link" >CourseRatingSummary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseRequest.html" data-type="entity-link" >CourseRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseRequest-1.html" data-type="entity-link" >CourseRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseResponse.html" data-type="entity-link" >CourseResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseResponse-1.html" data-type="entity-link" >CourseResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CourseRouteParams.html" data-type="entity-link" >CourseRouteParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateCommentDto.html" data-type="entity-link" >CreateCommentDto</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DashboardAnalyticsResponse.html" data-type="entity-link" >DashboardAnalyticsResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DashboardDateFilter.html" data-type="entity-link" >DashboardDateFilter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DashboardPanelResponse.html" data-type="entity-link" >DashboardPanelResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Datum.html" data-type="entity-link" >Datum</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DeleteOwnerResponse.html" data-type="entity-link" >DeleteOwnerResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DetailResponse.html" data-type="entity-link" >DetailResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DifficultQuestionMetric.html" data-type="entity-link" >DifficultQuestionMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Difficulty.html" data-type="entity-link" >Difficulty</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Difficulty-1.html" data-type="entity-link" >Difficulty</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Difficulty-2.html" data-type="entity-link" >Difficulty</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DifficultyResponse.html" data-type="entity-link" >DifficultyResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DifficultySummary.html" data-type="entity-link" >DifficultySummary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EducationalLevel.html" data-type="entity-link" >EducationalLevel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EducationalLevel-1.html" data-type="entity-link" >EducationalLevel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EducationalLevel-2.html" data-type="entity-link" >EducationalLevel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EducationalRequest.html" data-type="entity-link" >EducationalRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EducationalResponse.html" data-type="entity-link" >EducationalResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EducationalUnit.html" data-type="entity-link" >EducationalUnit</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EducationalUnit-1.html" data-type="entity-link" >EducationalUnit</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EducationalUnitInfo.html" data-type="entity-link" >EducationalUnitInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EducationalUser.html" data-type="entity-link" >EducationalUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduLevel.html" data-type="entity-link" >EduLevel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduLevelAdmin.html" data-type="entity-link" >EduLevelAdmin</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduLevelAdminIndexResponse.html" data-type="entity-link" >EduLevelAdminIndexResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduLevelAdminMeta.html" data-type="entity-link" >EduLevelAdminMeta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduLevelDeleteResponse.html" data-type="entity-link" >EduLevelDeleteResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduLevelPayload.html" data-type="entity-link" >EduLevelPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduUnit.html" data-type="entity-link" >EduUnit</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduUnitAdmin.html" data-type="entity-link" >EduUnitAdmin</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduUnitAdminIndexResponse.html" data-type="entity-link" >EduUnitAdminIndexResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduUnitAdminMeta.html" data-type="entity-link" >EduUnitAdminMeta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduUnitDeleteResponse.html" data-type="entity-link" >EduUnitDeleteResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduUnitPayload.html" data-type="entity-link" >EduUnitPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EduUnitWithLevels.html" data-type="entity-link" >EduUnitWithLevels</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EventMap.html" data-type="entity-link" >EventMap</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Filters.html" data-type="entity-link" >Filters</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GoogleLoginRequest.html" data-type="entity-link" >GoogleLoginRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HistoryItemBase.html" data-type="entity-link" >HistoryItemBase</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HistoryItemCompletados.html" data-type="entity-link" >HistoryItemCompletados</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HistoryItemGuardados.html" data-type="entity-link" >HistoryItemGuardados</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HistoryItemHistorial.html" data-type="entity-link" >HistoryItemHistorial</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ImagePreviewItem.html" data-type="entity-link" >ImagePreviewItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InformationRequest.html" data-type="entity-link" >InformationRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InformationShowResponse.html" data-type="entity-link" >InformationShowResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InformationUpdateResponse.html" data-type="entity-link" >InformationUpdateResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterestCategory.html" data-type="entity-link" >InterestCategory</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterestData.html" data-type="entity-link" >InterestData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterestResponse.html" data-type="entity-link" >InterestResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InterestUpdateRequest.html" data-type="entity-link" >InterestUpdateRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InvitationSearchUser.html" data-type="entity-link" >InvitationSearchUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InviteCollaboratorResponse.html" data-type="entity-link" >InviteCollaboratorResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LastChapterInfo.html" data-type="entity-link" >LastChapterInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LastView.html" data-type="entity-link" >LastView</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LastViewedChapter.html" data-type="entity-link" >LastViewedChapter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LearingContentResponse.html" data-type="entity-link" >LearingContentResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Learning.html" data-type="entity-link" >Learning</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LearningContent.html" data-type="entity-link" >LearningContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LearningContent-1.html" data-type="entity-link" >LearningContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LearningContent-2.html" data-type="entity-link" >LearningContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LearningContentUpdate.html" data-type="entity-link" >LearningContentUpdate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LearningMeta.html" data-type="entity-link" >LearningMeta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LeaveCourseResponse.html" data-type="entity-link" >LeaveCourseResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LikedCommentRequest.html" data-type="entity-link" >LikedCommentRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LikedCommentResponse.html" data-type="entity-link" >LikedCommentResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LikedRequest.html" data-type="entity-link" >LikedRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LikeResponse.html" data-type="entity-link" >LikeResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Links.html" data-type="entity-link" >Links</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LocationItem.html" data-type="entity-link" >LocationItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LocationListResponse.html" data-type="entity-link" >LocationListResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoginRequest.html" data-type="entity-link" >LoginRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MaskingProps.html" data-type="entity-link" >MaskingProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Meta.html" data-type="entity-link" >Meta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Meta-1.html" data-type="entity-link" >Meta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Miniature.html" data-type="entity-link" >Miniature</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Miniature-1.html" data-type="entity-link" >Miniature</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Miniature-2.html" data-type="entity-link" >Miniature</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MiniatureResponse.html" data-type="entity-link" >MiniatureResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Module.html" data-type="entity-link" >Module</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ModuleResponse.html" data-type="entity-link" >ModuleResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ModuleUpsert.html" data-type="entity-link" >ModuleUpsert</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotificationData.html" data-type="entity-link" >NotificationData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotificationIndexResponse.html" data-type="entity-link" >NotificationIndexResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NotificationMeta.html" data-type="entity-link" >NotificationMeta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Owner.html" data-type="entity-link" >Owner</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OwnerInfo.html" data-type="entity-link" >OwnerInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OwnerSummary.html" data-type="entity-link" >OwnerSummary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginatedResponse.html" data-type="entity-link" >PaginatedResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginatedResponse-1.html" data-type="entity-link" >PaginatedResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Pagination.html" data-type="entity-link" >Pagination</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginationLink.html" data-type="entity-link" >PaginationLink</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginationMeta.html" data-type="entity-link" >PaginationMeta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginationMeta-1.html" data-type="entity-link" >PaginationMeta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginationMeta-2.html" data-type="entity-link" >PaginationMeta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginationMeta-3.html" data-type="entity-link" >PaginationMeta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Parroquia.html" data-type="entity-link" >Parroquia</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PersonalizeStep.html" data-type="entity-link" >PersonalizeStep</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Portfolio.html" data-type="entity-link" >Portfolio</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PortfolioCourseResponse.html" data-type="entity-link" >PortfolioCourseResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PortfolioRequest.html" data-type="entity-link" >PortfolioRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PortfolioResponse.html" data-type="entity-link" >PortfolioResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProgressBucket.html" data-type="entity-link" >ProgressBucket</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProgressData.html" data-type="entity-link" >ProgressData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProgressDistributionMetric.html" data-type="entity-link" >ProgressDistributionMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProgressRequest.html" data-type="entity-link" >ProgressRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProgressResponse.html" data-type="entity-link" >ProgressResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Provincia.html" data-type="entity-link" >Provincia</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Question.html" data-type="entity-link" >Question</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QuestionResponse.html" data-type="entity-link" >QuestionResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QuestionType.html" data-type="entity-link" >QuestionType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QuestionUpdateItem.html" data-type="entity-link" >QuestionUpdateItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QuestionUpdateRequest.html" data-type="entity-link" >QuestionUpdateRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QuestionUpdateResponse.html" data-type="entity-link" >QuestionUpdateResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QuestionUpdateTestPayload.html" data-type="entity-link" >QuestionUpdateTestPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RatingCourseRequest.html" data-type="entity-link" >RatingCourseRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RatingCourseResponse.html" data-type="entity-link" >RatingCourseResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RatingDistributionItem.html" data-type="entity-link" >RatingDistributionItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Ratings.html" data-type="entity-link" >Ratings</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RawProvinciaData.html" data-type="entity-link" >RawProvinciaData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RecentFeedbackItem.html" data-type="entity-link" >RecentFeedbackItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RegisterCourseByCodeRequest.html" data-type="entity-link" >RegisterCourseByCodeRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RegisterCourseResponse.html" data-type="entity-link" >RegisterCourseResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RegisterRequest.html" data-type="entity-link" >RegisterRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RepliesResponse.html" data-type="entity-link" >RepliesResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RetentionFunnelItem.html" data-type="entity-link" >RetentionFunnelItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Role.html" data-type="entity-link" >Role</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RoleItem.html" data-type="entity-link" >RoleItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RoleListResponse.html" data-type="entity-link" >RoleListResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SavedRequest.html" data-type="entity-link" >SavedRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SavedResponse.html" data-type="entity-link" >SavedResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Sede.html" data-type="entity-link" >Sede</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Sede-1.html" data-type="entity-link" >Sede</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Sede-2.html" data-type="entity-link" >Sede</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SedeAllFilters.html" data-type="entity-link" >SedeAllFilters</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SedeApiBaseResponse.html" data-type="entity-link" >SedeApiBaseResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SedeInfo.html" data-type="entity-link" >SedeInfo</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SedePaginatedResponse.html" data-type="entity-link" >SedePaginatedResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SedePayload.html" data-type="entity-link" >SedePayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SedeResponse.html" data-type="entity-link" >SedeResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SedeWithUsersCount.html" data-type="entity-link" >SedeWithUsersCount</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SingleCommentResponse.html" data-type="entity-link" >SingleCommentResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StudioCourseUpdatePayload.html" data-type="entity-link" >StudioCourseUpdatePayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SuggestionItem.html" data-type="entity-link" >SuggestionItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SuggestionResponse.html" data-type="entity-link" >SuggestionResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestAnswerOption.html" data-type="entity-link" >TestAnswerOption</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestConfig.html" data-type="entity-link" >TestConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestIndexContext.html" data-type="entity-link" >TestIndexContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestIndexResponse.html" data-type="entity-link" >TestIndexResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestPageQuery.html" data-type="entity-link" >TestPageQuery</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestPerformanceMetric.html" data-type="entity-link" >TestPerformanceMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestQuestion.html" data-type="entity-link" >TestQuestion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestShowData.html" data-type="entity-link" >TestShowData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestShowResponse.html" data-type="entity-link" >TestShowResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Tutor.html" data-type="entity-link" >Tutor</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TutorSummary.html" data-type="entity-link" >TutorSummary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TypeLarningContentResponse.html" data-type="entity-link" >TypeLarningContentResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TypeLearningContent.html" data-type="entity-link" >TypeLearningContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TypeLearningContent-1.html" data-type="entity-link" >TypeLearningContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TypeLearningContent-2.html" data-type="entity-link" >TypeLearningContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TypeQuestion.html" data-type="entity-link" >TypeQuestion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TypeQuestionResponse.html" data-type="entity-link" >TypeQuestionResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiA11Props.html" data-type="entity-link" >UiA11Props</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiAvatarProps.html" data-type="entity-link" >UiAvatarProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiBadgeProps.html" data-type="entity-link" >UiBadgeProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiButtonProps.html" data-type="entity-link" >UiButtonProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiCheckboxProps.html" data-type="entity-link" >UiCheckboxProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiCounterProps.html" data-type="entity-link" >UiCounterProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiDialogProps.html" data-type="entity-link" >UiDialogProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UifileUploadProps.html" data-type="entity-link" >UifileUploadProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiFormProps.html" data-type="entity-link" >UiFormProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiIconProps.html" data-type="entity-link" >UiIconProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiInputLabelProps.html" data-type="entity-link" >UiInputLabelProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiLabelProps.html" data-type="entity-link" >UiLabelProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiLoadingBarProps.html" data-type="entity-link" >UiLoadingBarProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiMediaProps.html" data-type="entity-link" >UiMediaProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiOverlayProps.html" data-type="entity-link" >UiOverlayProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiPanelProps.html" data-type="entity-link" >UiPanelProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiPopoverProps.html" data-type="entity-link" >UiPopoverProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiPreviewProps.html" data-type="entity-link" >UiPreviewProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiProps.html" data-type="entity-link" >UiProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiSbtnProps.html" data-type="entity-link" >UiSbtnProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiSelectDataviewProps.html" data-type="entity-link" >UiSelectDataviewProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiSelectProps.html" data-type="entity-link" >UiSelectProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiSidebarProps.html" data-type="entity-link" >UiSidebarProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiStyleProps.html" data-type="entity-link" >UiStyleProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiTabsProps.html" data-type="entity-link" >UiTabsProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiToastMessage.html" data-type="entity-link" >UiToastMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiToastProps.html" data-type="entity-link" >UiToastProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiToggleWitchProps.html" data-type="entity-link" >UiToggleWitchProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UiUnderlineProps.html" data-type="entity-link" >UiUnderlineProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UnreadCountResponse.html" data-type="entity-link" >UnreadCountResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateAllRequest.html" data-type="entity-link" >UpdateAllRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateAllResponse.html" data-type="entity-link" >UpdateAllResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateUsernameRequest.html" data-type="entity-link" >UpdateUsernameRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpdateUsernameResponse.html" data-type="entity-link" >UpdateUsernameResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User-1.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserInformation.html" data-type="entity-link" >UserInformation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserListItem.html" data-type="entity-link" >UserListItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserListParams.html" data-type="entity-link" >UserListParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserState.html" data-type="entity-link" >UserState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserState-1.html" data-type="entity-link" >UserState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidateInvitationResponse.html" data-type="entity-link" >ValidateInvitationResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidateUsernameRequest.html" data-type="entity-link" >ValidateUsernameRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidateUsernameResponse.html" data-type="entity-link" >ValidateUsernameResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/WatchingResponse.html" data-type="entity-link" >WatchingResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Window.html" data-type="entity-link" >Window</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});