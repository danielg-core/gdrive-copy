/**
 * A widget to select a folder from Google Drive.
 * Supports two selection methods:
 * 1. Pasting a folder URL
 *    - can be the URL, folder ID, or Sharing URL
 * 2. Using the Google Picker
 */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import { parseURL } from '../util/helpers';
import { showPicker } from '../util/picker';
import { getDriveFolderURL } from '../util/helpers';

export default class SelectFolder extends React.Component {
  constructor() {
    super();
    this.state = {
      value: '',
      errorText: '',
      folder: false
    };
    this.launchPicker = this.launchPicker.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.reset = this.reset.bind(this);
  }

  launchPicker() {
    this.props.picker.showPicker();
  }

  reset() {
    this.setState({
      folder: false,
      errorText: '',
      value: ''
    });
  }

  // allow TextInput to update if typing in
  // todo: should this be removed to only support pasting?
  handleChange(e) {
    this.setState({
      value: e.target.value,
      errorText: 'Paste a folder URL with Ctrl+V'
    });
  }

  /**
   * Parse the text pasted into the input
   * and extract an ID. Then call google script
   * to get metadata for that folder ID.
   * @param {pasteEvent} e
   */
  handlePaste(e) {
    const url = e.clipboardData.getData('Text');
    const id = parseURL(url);
    this.props.processing('Getting folder info');
    const _this = this;
    if (process.env.NODE_ENV === 'production') {
      google.script.run
        .withSuccessHandler(folder => {
          var parentid =
            folder.parents && folder.parents[0] ? folder.parents[0].id : null;
          _this.setState({
            folder: folder
          })
          _this.props.handleFolderSelect(folder.id, folder.title, parentid);
        })
        .withFailureHandler(err => {
          _this.props.showError(err.message);
        })
        .getMetadata(id);
    } else {
      // TEST MODE
      // ======================
      const _this = this;
      return setTimeout(function() {
        _this.setState({
          srcFolderURL: url
        });
        return _this.props.handleFolderSelect(id, 'test mode folder', id);
      }, 1000);
    }
  }

  render() {
    if (this.state.folder) {
      <div>
        <h4>You selected</h4>
        <a href={getDriveFolderURL(folder.id)} target="_blank">{folder.title}</a>
        <br />
        <RaisedButton
          label="Select a different folder"
          primary={true}
          onClick={this.reset}
        />
      </div>
    }

    return (
      <div>
        <TextField
          floatingLabelText="Paste Folder URL"
          key="folderName"
          id="folderName"
          name="folderName"
          onChange={this.handleChange}
          onPaste={this.handlePaste}
          value={this.state.value}
          errorText={this.state.errorText}
        />
        {this.props.picker && [
          <span className="circle-or">or</span>,
          <RaisedButton
            label="Search your Drive"
            primary={true}
            onClick={this.launchPicker}
          />
        ]}
      </div>
    );
  }
}

SelectFolder.propTypes = {
  handleFolderSelect: PropTypes.func.isRequired,
  processing: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  picker: PropTypes.object
};
