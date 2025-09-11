/*
 * Copyright (C) 2025 Ty Busby
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Time constants in seconds. Month is approximated as 30 days.
 */
export const Time = {
    Second: 1,
    Minute: 60,
    Hour: 3600, // 60 * 60
    Day: 86400, // 60 * 60 * 24
    Week: 604800, // 60 * 60 * 24 * 7
    Month: 2592000, // 60 * 60 * 24 * 30
    Year: 31536000, // 60 * 60 * 24 * 365
} as const;
